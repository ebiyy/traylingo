use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";
const MAX_ERROR_HISTORY: usize = 50;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// Anthropic API key
    #[serde(default)]
    pub api_key: String,

    /// Selected model
    #[serde(default = "default_model")]
    pub model: String,
}

fn default_model() -> String {
    "claude-haiku-4-5-20251001".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            model: default_model(),
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

/// Get API key from settings
pub fn get_api_key(app: &AppHandle) -> String {
    get_settings(app).api_key
}

/// Get model from settings
pub fn get_model(app: &AppHandle) -> String {
    get_settings(app).model
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        assert!(settings.api_key.is_empty());
        assert_eq!(settings.model, "claude-haiku-4-5-20251001");
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
    fn test_available_models() {
        assert!(!AVAILABLE_MODELS.is_empty());
        assert_eq!(AVAILABLE_MODELS[0].0, "claude-haiku-4-5-20251001");
    }
}
