# Error Management Strategy

This document outlines TrayLingo's approach to error handling, logging, and monitoring.

## Overview

TrayLingo uses a **structured error approach** with typed errors that flow from Rust backend to TypeScript frontend, enabling consistent error handling and user-friendly messages.

## Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Solid.js)"]
        direction LR
        parseError["parseError()"]
        TSError["TranslateError<br/>(typed)"]
        ErrorDisplay["ErrorDisplay<br/>(UI Component)"]
        parseError --> TSError --> ErrorDisplay
    end

    subgraph Backend["Backend (Rust)"]
        direction LR
        APIResponse["API Response"]
        RustError["TranslateError<br/>(enum)"]
        SerdeJson["serde_json<br/>::to_string()"]
        APIResponse --> RustError --> SerdeJson
    end

    SerdeJson -->|"JSON string<br/>(Tauri IPC)"| parseError
```

## Error Types

### TranslateError Enum

| Type | Trigger | HTTP Status | Retryable |
|------|---------|-------------|-----------|
| `ApiKeyMissing` | No API key configured | - | No (needs settings) |
| `AuthenticationFailed` | Invalid API key | 401 | No (needs settings) |
| `RateLimitExceeded` | Too many requests | 429 | Yes (with delay) |
| `Overloaded` | Claude API overloaded | 529 | Yes (with delay) |
| `Timeout` | Request timeout | - | Yes |
| `NetworkError` | Connection failed | - | Yes |
| `ApiError` | Other API errors | 4xx/5xx | Depends |
| `ParseError` | Invalid response format | - | Yes |
| `Unknown` | Unexpected errors | - | No |
| `IncompleteResponse` | Stream ended without `message_stop` | - | Yes |

### File Locations

| Layer | File | Purpose |
|-------|------|---------|
| Rust | `src-tauri/src/error.rs` | Error enum definition |
| TypeScript | `src/types/error.ts` | Type definitions + utilities |
| UI | `src/components/ErrorDisplay.tsx` | Error display component |

## Frontend Utilities

```typescript
import { parseError, getUserMessage, isRetryable, needsSettings, getRetryDelay } from './types/error';

// Parse error from backend
const error = parseError(backendError);

// Get user-friendly message
const message = getUserMessage(error);

// Check if retryable
if (isRetryable(error)) {
  const delay = getRetryDelay(error);
  // Retry after delay
}

// Check if needs API key configuration
if (needsSettings(error)) {
  // Show settings button
}
```

## Logging Strategy

### Current Implementation

TrayLingo uses `tauri-plugin-log` for local logging:

```rust
// Cargo.toml
tauri-plugin-log = "2"
log = "0.4"
```

Log files are stored in the app's data directory:
- macOS: `~/Library/Logs/com.traylingo.app/`

### Recommended Usage

```rust
use log::{info, warn, error, debug};

// In translate_stream():
info!("Starting translation: {} chars", text.len());
error!("API error: status={}, body={}", status, body);
warn!("Rate limited, retry_after={:?}", retry_after);
debug!("Stream chunk received: {} bytes", chunk.len());
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `error!` | Failed operations, API errors |
| `warn!` | Rate limits, retryable failures |
| `info!` | Successful operations, state changes |
| `debug!` | Detailed debugging info (dev only) |

## Error Monitoring Tools

### Do We Need Sentry?

**For TrayLingo: Not recommended at this stage.**

| Consideration | Assessment |
|---------------|------------|
| App type | Local menu bar utility |
| User base | Personal/small OSS |
| Error frequency | Low (API errors mostly) |
| Privacy | API keys in error context = risk |
| Maintenance | Extra dependency to maintain |

### When Sentry Makes Sense

- Large user base needing crash analytics
- Complex error patterns to analyze
- Team needing shared error visibility
- Production stability monitoring

### Alternatives for TrayLingo

| Option | Pros | Cons |
|--------|------|------|
| **Local logs (current)** | Simple, private, no cost | Manual inspection |
| **Console export** | User can share logs | Manual process |
| **GitHub Issues** | Community-driven | Requires user action |

### If You Want Sentry Later

```toml
# Cargo.toml
[dependencies]
sentry = "0.34"
sentry-tauri = "0.3"
```

```rust
// lib.rs
fn main() {
    let _guard = sentry::init(("DSN_HERE", sentry::ClientOptions {
        release: sentry::release_name!(),
        ..Default::default()
    }));

    // Tauri app setup...
}
```

**Privacy note**: Filter out API keys and sensitive data before sending to Sentry.

## Error Reporting for GitHub Issues

Users can copy error details directly from the error display for bug reports.

### Usage

When an error occurs, click the "Copy Report" button to copy a GitHub Issue-ready report:

```markdown
## Error Report

**Type**: `RateLimitExceeded`
**Message**: Rate limit exceeded. Please wait 30 seconds.
**Time**: 2025-12-05T18:00:00.000Z
**Model**: claude-haiku-4-5-20251001

### Details
```json
{
  "retry_after_secs": 30
}
```
```

### Implementation

```typescript
import { generateErrorReport, ErrorReportContext } from './types/error';

const context: ErrorReportContext = { model: 'claude-haiku-4-5-20251001' };
const report = generateErrorReport(error, context);
```

## Error History Storage

Errors are automatically logged to local storage for debugging patterns.

### Storage Location

Stored in `settings.json` under `error_history` key (same file as app settings).

### Data Structure

```typescript
interface ErrorHistoryEntry {
  timestamp: number;      // Unix timestamp (seconds)
  error_type: string;     // "RateLimitExceeded", "Timeout", etc.
  error_message: string;  // User-friendly message
  input_length: number;   // Length of text that triggered error
  model: string;          // Model used when error occurred
}
```

### Access via Tauri Commands

```typescript
// Get all error history (last 50 entries)
const history = await invoke<ErrorHistoryEntry[]>("get_error_history");

// Clear error history
await invoke("clear_error_history");
```

### Use Cases

- Debug recurring issues
- Identify patterns (e.g., "model X always times out with long texts")
- Provide context when reporting bugs

## Known Gaps & Future Improvements

### Low Priority

| Gap | Issue | Solution |
|-----|-------|----------|
| Offline detection | Request starts then fails | Check network before request |
| Content policy | Generic ApiError for violations | Parse error response for type |

### Completed

| Gap | Status |
|-----|--------|
| Streaming errors use string | ✅ Now uses `TranslateError::NetworkError` |
| Empty input not validated | ✅ Frontend guard added |
| Logs not used | ✅ `log::info!`, `error!`, `warn!` added |
| ParseError never fires | ✅ Now emits on JSON parse failure |
| Error report for issues | ✅ Copy Report button added |
| Incomplete response | ✅ `IncompleteResponse` error type + `message_stop` detection ([#13](https://github.com/ebiyy/traylingo/issues/13)) |
| No error history | ✅ Last 50 errors stored locally ([#14](https://github.com/ebiyy/traylingo/issues/14)) |

## Error Handling Checklist

When adding new features:

- [ ] Define error cases in `TranslateError` enum (if new type needed)
- [ ] Update TypeScript types in `src/types/error.ts`
- [ ] Add user-friendly message in `getUserMessage()`
- [ ] Determine if retryable and update `isRetryable()`
- [ ] Add appropriate log statements
- [ ] Test error paths manually

## Related Files

- [src-tauri/src/error.rs](../src-tauri/src/error.rs) - Rust error definitions
- [src/types/error.ts](../src/types/error.ts) - TypeScript types and utilities
- [src/components/ErrorDisplay.tsx](../src/components/ErrorDisplay.tsx) - Error UI component
