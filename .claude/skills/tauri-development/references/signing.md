# Tauri Updater Signing

## The Problem

Tauri v2 Updater's `latest.json` not generated. Known bug with empty password + environment variable combination.

## What Works

| Combination | Result |
|-------------|--------|
| Empty password + ENV direct | ❌ base64 decode error |
| Empty password + file path | ❌ Wrong password |
| Non-empty password + ENV direct | ❌ base64 decode error |
| **Non-empty password + file path** | ✅ **Works** |

## Solution

### Step 1: Generate Key with Non-Empty Password

```bash
pnpm tauri signer generate -w ~/.tauri/myapp.key
# Enter a password when prompted!
```

### Step 2: Update tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "endpoints": ["https://github.com/.../latest.json"],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6..."
    }
  }
}
```

### Step 3: GitHub Secrets

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Full content of `~/.tauri/myapp.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password used during generation |

### Step 4: GitHub Actions Workflow

```yaml
- name: Setup updater key
  run: |
    mkdir -p /tmp/.tauri
    echo -n "$TAURI_KEY" > /tmp/.tauri/myapp.key
  shell: bash
  env:
    TAURI_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}

- name: Build Tauri app
  uses: tauri-apps/tauri-action@v0.5.16
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: /tmp/.tauri/myapp.key
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

**Key points:**
- Use `echo -n` to prevent trailing newline
- `TAURI_SIGNING_PRIVATE_KEY` is the **file path**, not content
- Write content to file via separate env variable

## Common Pitfalls

### 1. GitHub Actions `${{ env.X }}` Evaluated at Parse Time

```yaml
# This doesn't work
- run: export TAURI_KEY_PATH=/tmp/key
- uses: tauri-action@v0.5.16
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ env.TAURI_KEY_PATH }}  # Empty!
```

**Solution:** Use fixed paths

### 2. Trailing Newline Causes base64 Error

```yaml
# Wrong
run: printf '%s\n' "$KEY" > /tmp/key

# Correct
run: echo -n "$KEY" > /tmp/key
```

### 3. Verify Key File

```bash
cat ~/.tauri/myapp.key | xxd | tail
# Last byte should NOT be 0a (newline)
```

## Expected Assets After Successful Build

```
✅ App_0.1.0_aarch64.dmg
✅ App_aarch64.app.tar.gz
✅ App_aarch64.app.tar.gz.sig
✅ latest.json
```

## References

- [Tauri Updater Guide](https://v2.tauri.app/plugin/updater/)
- [GitHub Issue #13485](https://github.com/tauri-apps/tauri/issues/13485)
