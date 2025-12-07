use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

// Regex patterns for masking sensitive data in cache previews
static EMAIL_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap());
static URL_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"https?://[^\s]+").unwrap());
static LONG_NUMBER_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d{4,}").unwrap());

const STORE_PATH: &str = "settings.json";
const MAX_ERROR_HISTORY: usize = 50;
const MAX_TRANSLATION_CACHE: usize = 100; // Reduced from 500 for privacy
const CACHE_TTL_SECS: i64 = 30 * 24 * 60 * 60; // 30 days
const SOURCE_PREVIEW_LENGTH: usize = 30; // Reduced from 100 for privacy

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    // NOTE: API key is stored in macOS Keychain, not here.
    // See src/keychain.rs for Keychain operations.
    /// Selected model
    #[serde(default = "default_model")]
    pub model: String,

    /// Send error reports to Sentry (opt-out: enabled by default)
    #[serde(default = "default_send_telemetry")]
    pub send_telemetry: bool,

    /// Enable translation cache (default: true)
    #[serde(default = "default_cache_enabled")]
    pub cache_enabled: bool,
}

fn default_model() -> String {
    "claude-haiku-4-5-20251001".to_string()
}

fn default_send_telemetry() -> bool {
    true // Opt-out: enabled by default
}

fn default_cache_enabled() -> bool {
    true // Cache enabled by default
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            model: default_model(),
            send_telemetry: default_send_telemetry(),
            cache_enabled: default_cache_enabled(),
        }
    }
}

/// Available models for selection (id, display_name)
pub const AVAILABLE_MODELS: &[(&str, &str)] = &[
    (
        "claude-haiku-4-5-20251001",
        "Claude Haiku 4.5 (Fast, Cheap)",
    ),
    (
        "claude-sonnet-4-5-20250514",
        "Claude Sonnet 4.5 (Best Quality)",
    ),
    ("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet"),
    ("claude-3-5-haiku-20241022", "Claude 3.5 Haiku"),
];

/// Model pricing (input_price_per_million, output_price_per_million)
pub fn get_model_pricing(model: &str) -> (f64, f64) {
    match model {
        "claude-haiku-4-5-20251001" => (1.0, 5.0),
        "claude-sonnet-4-5-20250514" => (3.0, 15.0),
        "claude-3-5-sonnet-20241022" => (3.0, 15.0),
        "claude-3-5-haiku-20241022" => (0.8, 4.0),
        _ => (1.0, 5.0), // default to Haiku 4.5 pricing
    }
}

pub fn get_settings(app: &AppHandle) -> Settings {
    let store = app.store(STORE_PATH).ok();

    store
        .and_then(|s| s.get("settings"))
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

pub fn save_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        "settings",
        serde_json::to_value(settings).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

/// Check if cache is enabled
pub fn is_cache_enabled(app: &AppHandle) -> bool {
    get_settings(app).cache_enabled
}

// ==================== Error History ====================

/// Entry for error history storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorHistoryEntry {
    /// Unix timestamp in seconds
    pub timestamp: i64,
    /// Error type (e.g., "RateLimitExceeded", "Timeout")
    pub error_type: String,
    /// User-friendly error message
    pub error_message: String,
    /// Length of input text that triggered the error
    pub input_length: usize,
    /// Model used when error occurred
    pub model: String,
}

/// Save an error to history (keeps last MAX_ERROR_HISTORY entries)
pub fn save_error(app: &AppHandle, entry: ErrorHistoryEntry) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;

    let mut history: Vec<ErrorHistoryEntry> = store
        .get("error_history")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    history.push(entry);

    // Keep only the last MAX_ERROR_HISTORY entries
    if history.len() > MAX_ERROR_HISTORY {
        history.drain(0..(history.len() - MAX_ERROR_HISTORY));
    }

    store.set(
        "error_history",
        serde_json::to_value(&history).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

/// Get all error history entries
pub fn get_error_history(app: &AppHandle) -> Vec<ErrorHistoryEntry> {
    app.store(STORE_PATH)
        .ok()
        .and_then(|s| s.get("error_history"))
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

/// Clear all error history
pub fn clear_error_history(app: &AppHandle) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        "error_history",
        serde_json::to_value::<Vec<ErrorHistoryEntry>>(vec![]).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// ==================== Window Position ====================

/// Window position for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

/// Get saved window position for a window
pub fn get_window_position(app: &AppHandle, window_label: &str) -> Option<WindowPosition> {
    let key = format!("window_position_{}", window_label);
    app.store(STORE_PATH)
        .ok()
        .and_then(|s| s.get(&key))
        .and_then(|v| serde_json::from_value(v).ok())
}

/// Save window position
pub fn save_window_position(
    app: &AppHandle,
    window_label: &str,
    x: i32,
    y: i32,
) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let key = format!("window_position_{}", window_label);
    let position = WindowPosition { x, y };
    store.set(
        &key,
        serde_json::to_value(&position).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// ==================== Translation Cache ====================

/// Cached translation entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedTranslation {
    /// SHA256 hash of source text (for lookup)
    pub source_hash: String,
    /// Original source text (truncated for storage, first 30 chars)
    pub source_preview: String,
    /// Translated text
    pub translated_text: String,
    /// Model used for translation
    pub model: String,
    /// Unix timestamp when cached
    pub timestamp: i64,
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheStats {
    /// Total entries in cache
    pub entry_count: usize,
    /// Cache hits (translations served from cache)
    pub hits: u64,
    /// Cache misses (new translations)
    pub misses: u64,
}

/// Generate SHA256 hash for cache key
fn hash_text(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Create a safe preview of text for cache storage.
/// Truncates to SOURCE_PREVIEW_LENGTH and masks sensitive patterns.
fn create_safe_preview(text: &str) -> String {
    let preview: String = text.chars().take(SOURCE_PREVIEW_LENGTH).collect();
    mask_sensitive_patterns(&preview)
}

/// Mask sensitive patterns in text (emails, URLs, long numbers)
fn mask_sensitive_patterns(text: &str) -> String {
    let text = EMAIL_REGEX.replace_all(text, "[EMAIL]");
    let text = URL_REGEX.replace_all(&text, "[URL]");
    let text = LONG_NUMBER_REGEX.replace_all(&text, "[***]");
    text.to_string()
}

/// Get cached translation if exists (respects cache_enabled setting)
pub fn get_cached_translation(app: &AppHandle, text: &str, model: &str) -> Option<String> {
    // Check if cache is enabled
    if !is_cache_enabled(app) {
        return None;
    }

    let store = app.store(STORE_PATH).ok()?;
    let hash = hash_text(text);

    let cache: Vec<CachedTranslation> = store
        .get("translation_cache")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    // Get current timestamp for expiry check
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    // Find matching entry (same hash and model, not expired)
    let result = cache
        .iter()
        .find(|entry| {
            entry.source_hash == hash
                && entry.model == model
                && (now - entry.timestamp) < CACHE_TTL_SECS
        })
        .map(|entry| entry.translated_text.clone());

    // Update stats
    if let Ok(store) = app.store(STORE_PATH) {
        let mut stats: CacheStats = store
            .get("cache_stats")
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();

        if result.is_some() {
            stats.hits += 1;
        } else {
            stats.misses += 1;
        }

        if let Ok(value) = serde_json::to_value(&stats) {
            store.set("cache_stats", value);
            let _ = store.save();
        }
    }

    result
}

/// Save translation to cache (respects cache_enabled setting, LRU eviction when full)
pub fn save_cached_translation(
    app: &AppHandle,
    text: &str,
    translated_text: &str,
    model: &str,
) -> Result<(), String> {
    // Check if cache is enabled
    if !is_cache_enabled(app) {
        return Ok(());
    }

    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let hash = hash_text(text);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let mut cache: Vec<CachedTranslation> = store
        .get("translation_cache")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    // Remove expired entries (30-day TTL)
    cache.retain(|entry| (now - entry.timestamp) < CACHE_TTL_SECS);

    // Check if already exists (update timestamp if so)
    if let Some(entry) = cache
        .iter_mut()
        .find(|e| e.source_hash == hash && e.model == model)
    {
        entry.timestamp = now;
        entry.translated_text = translated_text.to_string();
    } else {
        // Add new entry with safe preview (truncated + masked for privacy)
        let entry = CachedTranslation {
            source_hash: hash,
            source_preview: create_safe_preview(text),
            translated_text: translated_text.to_string(),
            model: model.to_string(),
            timestamp: now,
        };
        cache.push(entry);
    }

    // LRU eviction: remove oldest entries if over limit
    if cache.len() > MAX_TRANSLATION_CACHE {
        cache.sort_by(|a, b| b.timestamp.cmp(&a.timestamp)); // newest first
        cache.truncate(MAX_TRANSLATION_CACHE);
    }

    // Update entry count in stats
    let mut stats: CacheStats = store
        .get("cache_stats")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    stats.entry_count = cache.len();

    store.set(
        "translation_cache",
        serde_json::to_value(&cache).map_err(|e| e.to_string())?,
    );
    store.set(
        "cache_stats",
        serde_json::to_value(&stats).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

/// Get cache statistics
#[allow(dead_code)] // For future UI feature
pub fn get_cache_stats(app: &AppHandle) -> CacheStats {
    app.store(STORE_PATH)
        .ok()
        .and_then(|s| s.get("cache_stats"))
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

/// Clear translation cache (called from UI)
pub fn clear_translation_cache(app: &AppHandle) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        "translation_cache",
        serde_json::to_value::<Vec<CachedTranslation>>(vec![]).map_err(|e| e.to_string())?,
    );
    store.set(
        "cache_stats",
        serde_json::to_value(CacheStats::default()).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        // NOTE: api_key is now stored in macOS Keychain, not in Settings
        assert_eq!(settings.model, "claude-haiku-4-5-20251001"); // Default model
        assert!(settings.send_telemetry); // Default: enabled (opt-out)
        assert!(settings.cache_enabled); // Default: enabled
    }

    #[test]
    fn test_model_pricing() {
        let (input, output) = get_model_pricing("claude-haiku-4-5-20251001");
        assert_eq!(input, 1.0);
        assert_eq!(output, 5.0);

        let (input, output) = get_model_pricing("claude-sonnet-4-5-20250514");
        assert_eq!(input, 3.0);
        assert_eq!(output, 15.0);
    }

    #[test]
    fn test_mask_sensitive_patterns() {
        // Email masking
        assert_eq!(
            mask_sensitive_patterns("Contact: user@example.com"),
            "Contact: [EMAIL]"
        );

        // URL masking
        assert_eq!(
            mask_sensitive_patterns("See https://example.com/path"),
            "See [URL]"
        );

        // Long number masking (4+ digits)
        assert_eq!(mask_sensitive_patterns("Card: 1234567890"), "Card: [***]");

        // Short numbers are kept
        assert_eq!(mask_sensitive_patterns("Code: 123"), "Code: 123");

        // Combined
        assert_eq!(
            mask_sensitive_patterns("Email user@test.com or call 12345"),
            "Email [EMAIL] or call [***]"
        );
    }

    #[test]
    fn test_create_safe_preview() {
        // Long text is truncated
        let long_text = "a".repeat(100);
        assert_eq!(create_safe_preview(&long_text).len(), SOURCE_PREVIEW_LENGTH);

        // Short text with sensitive data is masked
        assert!(create_safe_preview("user@example.com").contains("[EMAIL]"));
    }
}
