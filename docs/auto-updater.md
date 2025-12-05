# Auto-Updater

TrayLingo uses [tauri-plugin-updater](https://v2.tauri.app/plugin/updater/) to provide automatic updates via GitHub Releases.

## How It Works

```
User clicks "Check for Updates..."
         ↓
App fetches latest.json from GitHub Releases
         ↓
Compares version with current app version
         ↓
If update available:
  → Download update artifact
  → Verify signature with public key
  → Install and relaunch
```

## Signing Keys

Updates are cryptographically signed to prevent tampering. The app verifies signatures using a public/private key pair.

### Key Locations

| Key | Location | Purpose |
|-----|----------|---------|
| Private | `~/.tauri/traylingo.key` | Signs update artifacts (CI only) |
| Public | `src-tauri/tauri.conf.json` | Verifies signatures (embedded in app) |

### Key Management

**Private Key Security:**
- Never commit to repository
- Stored in GitHub Secrets as `TAURI_SIGNING_PRIVATE_KEY`
- Keep local backup in secure location (e.g., `~/.tauri/`)
- If lost, you must generate new keys and release a non-auto-updatable version

**Regenerating Keys:**

```bash
# Generate new keypair
pnpm tauri signer generate -w ~/.tauri/traylingo.key

# Update GitHub Secret
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/traylingo.key

# Update public key in tauri.conf.json
cat ~/.tauri/traylingo.key.pub
# Copy output to plugins.updater.pubkey in tauri.conf.json
```

> **Warning:** Changing keys breaks auto-update for existing users. They must manually download the new version.

## Configuration

### tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/ebiyy/traylingo/releases/latest/download/latest.json"
      ],
      "pubkey": "<base64-encoded-public-key>"
    }
  }
}
```

### GitHub Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Yes | Contents of `~/.tauri/traylingo.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | No | Password if key is encrypted (empty = not needed) |

### Setting Secrets via CLI

```bash
# Set private key
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/traylingo.key

# Set password (only if key has password)
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body "your-password"
```

## Release Workflow

When a version tag (e.g., `v0.1.0`) is pushed:

1. **GitHub Actions** triggers `release.yml`
2. **tauri-action** builds the app with signing
3. Artifacts uploaded to GitHub Releases:
   - `TrayLingo_x.x.x_aarch64.dmg` (Apple Silicon)
   - `TrayLingo_x.x.x_x64.dmg` (Intel)
   - `latest.json` (update manifest)

### latest.json Structure

```json
{
  "version": "0.2.0",
  "notes": "Release notes here",
  "pub_date": "2025-01-01T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "<signature>",
      "url": "https://github.com/.../TrayLingo_0.2.0_aarch64.app.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "<signature>",
      "url": "https://github.com/.../TrayLingo_0.2.0_x64.app.tar.gz"
    }
  }
}
```

## User Experience

### Tray Menu

Users can manually check for updates via:
- Right-click tray icon → "Check for Updates..."

### Update Flow

1. **Update Available**: System notification appears
2. **Download**: Automatic download starts
3. **Install**: App installs update
4. **Relaunch**: App automatically restarts

### Notifications

| Event | Notification |
|-------|--------------|
| Update found | "Version X.X.X is available. Downloading..." |
| Install complete | "Update installed. Restart to apply changes." |
| No update | "You're running the latest version." |
| Error | "Update Check Failed: [error message]" |

## Troubleshooting

### "Update Check Failed" Error

Common causes:
- No internet connection
- GitHub API rate limit
- `latest.json` not found (no releases yet)
- Malformed `latest.json`

### Signature Verification Failed

Causes:
- Public key mismatch between app and `latest.json`
- Corrupted download
- Tampered artifact

Solution: Ensure `TAURI_SIGNING_PRIVATE_KEY` in GitHub Secrets matches the public key in `tauri.conf.json`.

### Update Not Detected

The updater compares semver versions. Ensure:
- New version is higher than current
- Tag format is `vX.X.X`
- `latest.json` exists in the release

## Development Notes

### Testing Updates Locally

Updates cannot be fully tested locally because:
- `latest.json` must be on GitHub Releases
- Signatures require CI build process

For development, the update check will fail gracefully with "Update Check Failed" notification.

### Code Structure

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | `check_for_updates()` function, tray menu |
| `src/App.tsx` | Update event listeners, notifications |
| `.github/workflows/release.yml` | CI build with signing |
| `src-tauri/tauri.conf.json` | Updater configuration |

## Security Considerations

- **Private key exposure**: If compromised, attacker could sign malicious updates. Rotate keys immediately.
- **HTTPS only**: Update endpoint uses HTTPS to prevent MITM attacks.
- **Signature verification**: Every update is verified before installation.
- **No code signing (macOS)**: Users may see Gatekeeper warnings. This is expected for non-App Store distribution.
