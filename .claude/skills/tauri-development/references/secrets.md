# Secret Storage

## The Problem

`tauri-plugin-store` saves data as **plain text JSON**:

```
~/Library/Application Support/com.your.app/settings.json
```

```json
{
  "api_key": "sk-ant-api03-xxxxxxxxxxxxx"  // Exposed!
}
```

**Risks:**
- Readable by any process with user permissions
- Included in Time Machine backups (unencrypted)
- Easy target for malware scanning known paths

## Solution: OS Credential Store

| OS | Store | Encryption |
|----|-------|------------|
| macOS | Keychain | AES-256 |
| Windows | Credential Manager | DPAPI |
| Linux | Secret Service | Implementation-dependent |

## macOS Implementation

### Why Not `keyring` Crate?

The `keyring` crate may fail silently on unsigned dev builds. Use `security` CLI instead.

### Using `security` Command

```rust
const SERVICE_NAME: &str = "com.your.app";
const ACCOUNT_NAME: &str = "api_key";
const SECURITY_CMD: &str = "/usr/bin/security";  // Full path!

pub fn get_api_key() -> Option<String> {
    let output = Command::new(SECURITY_CMD)
        .args([
            "find-generic-password",
            "-s", SERVICE_NAME,
            "-a", ACCOUNT_NAME,
            "-w",  // Password only
        ])
        .output()
        .ok()?;

    if output.status.success() {
        let password = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if password.is_empty() { None } else { Some(password) }
    } else {
        None
    }
}

pub fn set_api_key(key: &str) -> Result<(), String> {
    let _ = delete_api_key();  // Remove existing

    let output = Command::new(SECURITY_CMD)
        .args([
            "add-generic-password",
            "-s", SERVICE_NAME,
            "-a", ACCOUNT_NAME,
            "-w", key,
            "-U",  // Update if exists
        ])
        .output()
        .map_err(|e| format!("Failed: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub fn delete_api_key() -> Result<(), String> {
    let output = Command::new(SECURITY_CMD)
        .args([
            "delete-generic-password",
            "-s", SERVICE_NAME,
            "-a", ACCOUNT_NAME,
        ])
        .output()
        .map_err(|e| format!("Failed: {}", e))?;

    // "not found" is OK
    if output.status.success()
        || String::from_utf8_lossy(&output.stderr).contains("could not be found")
    {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
```

### Verify from Terminal

```bash
# Check if entry exists
security find-generic-password -s "com.your.app" -a "api_key"

# Get password value (may prompt for access)
security find-generic-password -s "com.your.app" -a "api_key" -w
```

## Data Separation

| Data | Storage | Reason |
|------|---------|--------|
| API keys, tokens | Keychain | Secrets with billing risk |
| Model selection | JSON | Preference, not secret |
| Feature flags | JSON | Configuration |

## Security Notes

### CLI Argument Exposure

API key briefly visible in process list:
```rust
.args([..., "-w", key, ...])
```

Acceptable trade-off for local single-user apps. For stricter security, use stdin or direct Keychain API.

### Full Path Required

Always use `/usr/bin/security` to prevent PATH hijacking.

## keyring vs security CLI

| Aspect | keyring crate | security CLI |
|--------|--------------|--------------|
| Cross-platform | ✅ | ❌ macOS only |
| Unsigned builds | ❌ May fail | ✅ Works |
| Dependencies | Rust crate | OS built-in |
