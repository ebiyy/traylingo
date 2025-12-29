# macOS Distribution

## Gatekeeper and Unsigned Apps

Homebrew Cask **does not bypass Gatekeeper** for unsigned apps. Users still see:

> "App is damaged and can't be opened."

### User Workaround

```bash
xattr -cr /Applications/YourApp.app
```

Or install with:
```bash
brew install --cask --no-quarantine your/tap/app
```

### Documentation Approach

Don't put `xattr` in Installation. Put it in Troubleshooting with security context:

```markdown
### Troubleshooting

#### "App is damaged" (macOS Gatekeeper)

This app is not yet notarized by Apple. If you trust this source:

    xattr -cr /Applications/YourApp.app

> **Security note:** Only run this for binaries from sources you trust.
```

## Homebrew Tap Security

### Your Tap is an Attack Vector

A Cask contains both `url` and `sha256`:

```ruby
cask "app" do
  url "https://github.com/owner/repo/releases/download/v1.0/App.dmg"
  sha256 "abc123..."
end
```

If attacker controls your tap, they can change **both**:

```ruby
url "https://evil.com/malware.dmg"
sha256 "evil-hash..."
```

Homebrew sees "URL and SHA256 match" and installs malware. **No warning.**

### Securing Your Tap

#### 1. Branch Protection (Essential)

```bash
gh api repos/OWNER/homebrew-tap/branches/main/protection -X PUT \
  --input - << 'EOF'
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "enforce_admins": false
}
EOF
```

- Require PR before merging (prevents direct push)
- Disable force pushes

#### 2. CODEOWNERS

```
# .github/CODEOWNERS
* @your-username
```

Get notified of all changes.

#### 3. PR-Based CI Updates

Instead of CI pushing directly:

```yaml
# Create PR instead of direct push
- name: Create branch and update
  run: |
    git checkout -b update-app-${{ steps.version.outputs.version }}
    # Update Cask file
    git push -u origin update-app-$VERSION

- name: Create PR
  run: |
    gh pr create \
      --repo OWNER/homebrew-tap \
      --title "Update app to $VERSION" \
      --base main
```

**Flow:**
```
Release published → CI creates PR → You review & merge
```

Extra click is worth the security.

## Distribution Options

| Approach | Cost | User Experience |
|----------|------|-----------------|
| Unsigned + xattr docs | Free | Poor (terminal required) |
| Ad-hoc signed | Free | Same as unsigned |
| Developer ID signed | $99/year | Good (one Gatekeeper prompt) |
| Notarized | $99/year | Best (no warnings) |

For serious distribution, Apple Developer Program ($99/year) is worth it.

## Summary

1. Homebrew doesn't fix Gatekeeper for unsigned apps
2. Your tap is a supply chain attack surface
3. Use branch protection + PR-based updates
4. Consider notarization for production apps
