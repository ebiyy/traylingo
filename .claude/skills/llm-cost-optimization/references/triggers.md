# AI Trigger Optimization

## First Rule: Verify Single Execution

Before ANY optimization, confirm your trigger fires exactly once:

```rust
log::info!("AI trigger fired: {:?}", event_details);
```

## Common Duplicate Trigger Sources

| Framework | Issue | Fix |
|-----------|-------|-----|
| Tauri global shortcuts | Pressed + Released | Check `event.state` |
| React onChange | Every keystroke | Debounce |
| IntersectionObserver | Rapid scroll | Threshold + debounce |
| WebSocket | Reconnect duplicates | Dedup by message ID |

## The Cost of Duplicates

| Issue | Impact |
|-------|--------|
| **Cost** | 2x API calls = 2x tokens |
| **UX** | Flickering, duplicate responses |
| **Race conditions** | Second overwrites first |
| **Crashes** | FFI + panic = abort() |

## Tauri Global Shortcut Fix

```rust
// BAD: fires twice
.on_shortcut(shortcut, |app, _shortcut, _event| {
    translate(text);  // Pressed AND Released
})

// GOOD: fires once
.on_shortcut(shortcut, |app, _shortcut, event| {
    if event.state != ShortcutState::Pressed {
        return;
    }
    translate(text);
})
```

## React Debouncing

```typescript
// BAD: every keystroke = API call
<input onChange={(e) => translate(e.target.value)} />

// GOOD: debounced
import { debounce } from 'lodash';

const debouncedTranslate = debounce((text) => translate(text), 300);
<input onChange={(e) => debouncedTranslate(e.target.value)} />
```

## Debugging Template

```rust
log::info!("Trigger fired: {:?}", event_details);

// Guard against duplicates
if !should_process(event) {
    log::debug!("Ignoring duplicate trigger");
    return;
}

log::info!("Processing AI request");
// ... actual AI call
```

## Pre-Ship Checklist

1. [ ] Add logging to every trigger point
2. [ ] Verify single execution per action
3. [ ] Check event types (press/release, start/end)
4. [ ] Add debounce for rapid-fire triggers
5. [ ] Test: key held down, rapid clicks, concurrent

## The Math

> "AI API costs scale with bugs. A trigger that fires twice costs twice as much."

Duplicate trigger fix:
- Before: 2 API calls per action
- After: 1 API call per action
- **Savings: 50%** (for free)

This is often the highest ROI optimization—zero code complexity, immediate 50% savings.
