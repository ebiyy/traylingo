use serde::{Deserialize, Serialize};

/// Structured error type for translation operations
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum TranslateError {
    /// API key not configured
    ApiKeyMissing,

    /// Invalid or expired API key (401)
    AuthenticationFailed { message: String },

    /// Rate limit exceeded (429)
    RateLimitExceeded { retry_after_secs: Option<u64> },

    /// Claude API overloaded (529)
    Overloaded,

    /// Request timeout
    Timeout { timeout_secs: u64 },

    /// Network connectivity issue
    NetworkError { message: String },

    /// API returned an error
    ApiError { status: u16, message: String },

    /// Failed to parse API response
    ParseError { message: String },

    /// Generic/unknown error
    Unknown { message: String },
}

impl TranslateError {
    /// User-friendly error message (safe for display)
    pub fn user_message(&self) -> String {
        match self {
            Self::ApiKeyMissing => {
                "API key not configured. Please add your Anthropic API key in Settings.".into()
            }
            Self::AuthenticationFailed { .. } => {
                "Invalid API key. Please check your API key in Settings.".into()
            }
            Self::RateLimitExceeded { retry_after_secs } => match retry_after_secs {
                Some(secs) => format!("Rate limit exceeded. Please wait {} seconds.", secs),
                None => "Rate limit exceeded. Please wait a moment and try again.".into(),
            },
            Self::Overloaded => {
                "Claude API is currently overloaded. Please try again in a moment.".into()
            }
            Self::Timeout { timeout_secs } => {
                format!(
                    "Request timed out after {} seconds. Please try again.",
                    timeout_secs
                )
            }
            Self::NetworkError { .. } => {
                "Network error. Please check your internet connection.".into()
            }
            Self::ApiError { status, message } => format!("API error ({}): {}", status, message),
            Self::ParseError { .. } => "Failed to parse API response. Please try again.".into(),
            Self::Unknown { message } => format!("An error occurred: {}", message),
        }
    }
}

impl std::fmt::Display for TranslateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.user_message())
    }
}

impl std::error::Error for TranslateError {}

impl From<reqwest::Error> for TranslateError {
    fn from(e: reqwest::Error) -> Self {
        if e.is_timeout() {
            Self::Timeout { timeout_secs: 30 }
        } else if e.is_connect() {
            Self::NetworkError {
                message: e.to_string(),
            }
        } else {
            Self::Unknown {
                message: e.to_string(),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_message_api_key_missing() {
        let err = TranslateError::ApiKeyMissing;
        assert!(err.user_message().contains("API key not configured"));
    }

}
