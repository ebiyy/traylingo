# Privacy Requirements

## Why Privacy Policy is Needed

Even for OSS, if you send data to external services:
1. **User trust** - Users want to know what's collected
2. **Legal** - GDPR, CCPA may apply
3. **OSS transparency** - Open source should mean open data practices

## PRIVACY.md Template

```markdown
# Privacy Policy

## Data We Collect
- Error reports (stack traces, error messages)
- Device info (OS version, app version)

## Data We DO NOT Collect
- Translation content (clipboard text)
- API keys
- IP addresses (sendDefaultPii disabled)

## Local Storage
- Settings (JSON, unencrypted)
- Translation cache (can be disabled/cleared)

## Third-Party Services
- Sentry (error monitoring) - [Sentry Privacy](https://sentry.io/privacy/)
- GitHub (update checks) - [GitHub Privacy](https://docs.github.com/en/site-policy/privacy-policies)

## Opt-Out
Settings > "Send error reports" - Disable to stop all telemetry

## Data Deletion
Settings > "Clear cache" removes all locally stored translations
```

## Opt-Out Implementation

### Frontend

```typescript
let telemetryEnabled = true;

export function setTelemetryEnabled(enabled: boolean) {
  telemetryEnabled = enabled;
}

Sentry.init({
  beforeSend(event) {
    if (!telemetryEnabled) {
      return null;  // Drop the event
    }
    // ... scrubbing logic
    return event;
  },
});
```

### Backend

```rust
// Backend requires restart (Sentry init is once)
let settings = settings::get_settings(app.handle());
let _guard = if settings.send_telemetry {
    Some(sentry::init(...))
} else {
    None
};
```

### UI Note

```tsx
<p class="text-xs text-muted">
  Changes take effect after restarting the app.
</p>
```

## Data Flow Documentation

Map all data destinations:

```
User Input
    ↓
┌─────────────────────────────────────────┐
│  App (Local)                            │
│  - settings.json (preferences)          │
│  - translation cache (500 entries)      │
│  - API key (Keychain, not file)         │
└─────────────────────────────────────────┘
    ↓              ↓              ↓
  API          Sentry         GitHub
  (translation) (errors)     (updates)
```

## IP Address Handling

Be precise about what "not collected" means:

```markdown
// ❌ Vague
"IP addresses - sendDefaultPii disabled"

// ✅ Precise
"IP addresses are not attached to error events
(sendDefaultPii is disabled). Network infrastructure
may still see IPs during transmission."
```

## Privacy Regulations

| Regulation | Region | Key Requirements |
|------------|--------|------------------|
| GDPR | EU/EEA | Consent, data minimization, deletion rights |
| CCPA/CPRA | California | Disclosure, opt-out rights |
| APPI | Japan | Purpose disclosure, consent for sensitive |

### For Small OSS

Minimal compliance:
1. PRIVACY.md explaining data flows
2. Opt-out for telemetry
3. Clear cache option
4. No PII in error reports

### For Commercial

Consider:
- Legal review
- Cookie consent (if web-based)
- Data processing agreements
- Regional compliance assessment

## Cache Privacy

### Options to Offer

| Setting | Privacy Level |
|---------|---------------|
| Cache enabled | Low |
| Cache disabled | Medium |
| Cache + shorter TTL | Medium |
| Cache + masked preview | Medium-High |
| Hash-only (no preview) | High |

### Masking Implementation

```rust
fn mask_preview(text: &str) -> String {
    let text = EMAIL_REGEX.replace_all(text, "[EMAIL]");
    let text = URL_REGEX.replace_all(&text, "[URL]");
    let text = LONG_NUMBER_REGEX.replace_all(&text, "[***]");
    text.chars().take(30).collect()
}
```

### Clear Cache

```rust
#[tauri::command]
pub fn clear_translation_cache(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_PATH)?;
    store.set("translation_cache", json!([]));
    store.save()
}
```

Expose in Settings for user control.
