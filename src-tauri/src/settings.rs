use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";

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
