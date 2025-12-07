use std::process::Command;

const SERVICE_NAME: &str = "com.ebiyy.traylingo";
const ACCOUNT_NAME: &str = "anthropic_api_key";

/// Get API key from macOS Keychain using `security` command
pub fn get_api_key() -> Option<String> {
    let output = Command::new("security")
        .args([
            "find-generic-password",
            "-s",
            SERVICE_NAME,
            "-a",
            ACCOUNT_NAME,
            "-w", // Output only the password
        ])
        .output()
        .ok()?;

    if output.status.success() {
        let password = String::from_utf8_lossy(&output.stdout);
        let password = password.trim();
        if password.is_empty() {
            None
        } else {
            Some(password.to_string())
        }
    } else {
        None
    }
}

/// Save API key to macOS Keychain using `security` command
pub fn set_api_key(key: &str) -> Result<(), String> {
    log::info!("Attempting to save API key to Keychain...");

    // First, try to delete any existing entry (ignore errors)
    let _ = delete_api_key();

    // Add the new password
    let output = Command::new("security")
        .args([
            "add-generic-password",
            "-s",
            SERVICE_NAME,
            "-a",
            ACCOUNT_NAME,
            "-w",
            key,
            "-U", // Update if exists
        ])
        .output()
        .map_err(|e| format!("Failed to execute security command: {}", e))?;

    if output.status.success() {
        log::info!("API key saved to Keychain successfully");
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::error!("Keychain save failed: {}", stderr);
        Err(format!("Keychain save error: {}", stderr.trim()))
    }
}

/// Delete API key from macOS Keychain using `security` command
pub fn delete_api_key() -> Result<(), String> {
    let output = Command::new("security")
        .args([
            "delete-generic-password",
            "-s",
            SERVICE_NAME,
            "-a",
            ACCOUNT_NAME,
        ])
        .output()
        .map_err(|e| format!("Failed to execute security command: {}", e))?;

    // Ignore "not found" errors - if there's nothing to delete, that's fine
    if output.status.success()
        || String::from_utf8_lossy(&output.stderr).contains("could not be found")
    {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Keychain delete error: {}", stderr.trim()))
    }
}

/// Check if API key exists in Keychain
pub fn has_api_key() -> bool {
    get_api_key().is_some()
}
