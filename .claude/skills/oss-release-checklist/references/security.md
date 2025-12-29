# Security Checklist

## CSP (Content Security Policy)

### The Problem

```json
// ❌ CRITICAL: No protection
"security": {
  "csp": null
}
```

With `csp: null`, any script can execute. Tauri apps have filesystem/OS access—XSS is catastrophic.

### The Fix

```json
// ✅ Minimum safe CSP
"security": {
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.example.com https://*.sentry.io"
}
```

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default to same-origin |
| `script-src` | `'self'` | No inline scripts |
| `style-src` | `'self' 'unsafe-inline'` | Allow Tailwind inline |
| `connect-src` | whitelist | API endpoints only |

## Sentry PII Protection

### The Problem

For clipboard/translation apps, `sendDefaultPii: true` sends user's copied text to Sentry.

```typescript
// ❌ CRITICAL: User's passwords, secrets sent to Sentry
Sentry.init({
  sendDefaultPii: true,
});
```

### The Fix

```typescript
// ✅ Safe: Scrub all text data
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  // sendDefaultPii defaults to false
  beforeSend(event) {
    if (event.breadcrumbs) {
      for (const breadcrumb of event.breadcrumbs) {
        if (breadcrumb.data) {
          delete breadcrumb.data.text;
          delete breadcrumb.data.translation;
          delete breadcrumb.data.clipboard;
        }
      }
    }
    return event;
  },
});
```

### Rust Side

```rust
// ✅ Safe
sentry::ClientOptions {
    before_send: Some(Arc::new(|mut event| {
        event.extra.remove("text");
        event.extra.remove("translation");
        Some(event)
    })),
    ..Default::default()
}
```

### Warning Comment

Leave a prominent warning for future maintainers:

```typescript
// =============================================================================
// IMPORTANT: Privacy Protection - Sentry PII Masking
// =============================================================================
// This app handles sensitive user data (clipboard text).
// DO NOT:
// - Add sendDefaultPii: true
// - Log clipboard/translation text in breadcrumbs
// - Remove or weaken the beforeSend filter
// =============================================================================
```

## Secrets Management

### The Problem

Hardcoded DSNs mean forks send errors to YOUR Sentry.

```typescript
// ❌ Forks inherit your DSN
Sentry.init({
  dsn: "https://abc@sentry.io/123",
});
```

### The Fix

```typescript
// ✅ CI injects, empty for local/forks
const dsn = import.meta.env.VITE_SENTRY_DSN || "";
if (dsn) {
  Sentry.init({ dsn });
}
```

```rust
// Rust: option_env! embeds at compile time
let dsn = option_env!("SENTRY_DSN_BACKEND").unwrap_or("");
if !dsn.is_empty() {
    sentry::init(dsn);
}
```

```yaml
# CI: inject from secrets
env:
  VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN_FRONTEND }}
  SENTRY_DSN_BACKEND: ${{ secrets.SENTRY_DSN_BACKEND }}
```

## Event Listener Cleanup

### The Problem

Tauri `listen()` without cleanup causes memory leaks and HMR duplicates.

```typescript
// ❌ Listener never removed
onMount(async () => {
  await listen("event", handler);
});
```

### The Fix

```typescript
// ✅ Proper cleanup
let unlistenFns: UnlistenFn[] = [];

onMount(async () => {
  unlistenFns.push(await listen("event", handler));
});

onCleanup(() => {
  for (const unlisten of unlistenFns) {
    unlisten();
  }
});
```

## Cache Privacy

### Sensitive Pattern Masking

```rust
fn mask_sensitive_patterns(text: &str) -> String {
    let text = EMAIL_REGEX.replace_all(text, "[EMAIL]");
    let text = URL_REGEX.replace_all(&text, "[URL]");
    let text = LONG_NUMBER_REGEX.replace_all(&text, "[***]");
    text.to_string()
}
```

Apply to cache previews to avoid storing:
- Email addresses
- URLs
- Card/phone numbers (4+ digits)
