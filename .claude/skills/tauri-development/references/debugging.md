# Native App Debugging

## The Problem

Rust panics may not appear in Sentry. macOS crash reports show `abort() called`, but Sentry dashboard remains silent.

## Why Native App Debugging is Hard

### 1. Scattered Logs

```bash
# macOS system logs
log show --predicate 'subsystem == "com.your.app"' --last 5m

# Tauri logs
~/Library/Logs/com.your.app/

# Rust stderr (only in dev terminal)
pnpm tauri dev
```

### 2. Process Lifecycle

| Event | What Happens |
|-------|--------------|
| JS Error | Caught by Sentry JS SDK, sent immediately |
| Rust `Result::Err` | Serialized to frontend, handled gracefully |
| Rust `panic!` | Process aborts, HTTP requests may not complete |

### 3. Thread-Local State Issues

Sentry Rust SDK uses thread-local storage for its Hub. When a panic occurs in a spawned thread (like Tauri's async runtime), `with_integration()` may fail to find the integration.

### 4. Framework State Conflicts

```rust
// This may cause issues
app.manage(sentry_guard);

// Use a static instead
static SENTRY_GUARD: Mutex<Option<sentry::ClientInitGuard>> = Mutex::new(None);
```

## Debugging Strategy

### 1. Add Diagnostic Logging

```rust
eprintln!("[DEBUG] client.is_enabled(): {}", client.is_enabled());
```

### 2. Test Each Layer

```rust
// Test 1: Main thread
sentry::capture_message("Test from main", Level::Info);

// Test 2: Spawned thread
std::thread::spawn(|| {
    sentry::capture_message("Test from thread", Level::Info);
}).join();

// Test 3: Panic capture
std::thread::spawn(|| panic!("Test panic")).join();
```

### 3. Ensure Flush Completes

```rust
// Default flush returns immediately
client.flush(Some(Duration::from_secs(2)));  // Explicit timeout
```

## Custom Panic Handler

```rust
fn install_panic_handler_with_flush(
    default_hook: Box<dyn Fn(&std::panic::PanicInfo<'_>) + Sync + Send + 'static>,
) {
    let _sentry_hook = std::panic::take_hook();  // Remove Sentry's hook

    std::panic::set_hook(Box::new(move |panic_info| {
        if let Some(client) = sentry::Hub::main().client() {
            if client.is_enabled() {
                let event = sentry::protocol::Event {
                    message: Some(panic_info.to_string()),
                    level: sentry::Level::Fatal,
                    ..Default::default()
                };
                client.capture_event(event, None);
                client.flush(Some(std::time::Duration::from_secs(2)));
            }
        }
        default_hook(panic_info);
    }));
}
```

**Important:** Save the default hook BEFORE `sentry::init()` to avoid duplicate events.

## Checklist

1. [ ] Add `eprintln!` at critical points
2. [ ] Check user settings (send_telemetry, etc.)
3. [ ] Verify external services (DSN, API keys)
4. [ ] Test main thread vs spawned thread behavior
5. [ ] Use explicit flush with timeout
6. [ ] Use `Hub::main().client()` for direct API calls
