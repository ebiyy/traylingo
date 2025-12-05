# Quick Popup Feature: Implementation Journey

This document chronicles the implementation of the Quick Popup feature (⌘⌥J) in TrayLingo, including failed approaches, lessons learned, and technical debt incurred.

## The Goal

Add a quick translate popup that appears when pressing ⌘⌥J. Unlike the main window (⌘J), this popup should be:
- Minimal and focused on showing translation results only
- 400×300, positioned top-right near the tray icon
- Borderless, always on top
- Auto-close after copy action or Esc key

## Failed Approaches

### Attempt 1: Shared Frontend with Window Label Detection

**Approach**: Use single Solid.js app, detect window label at runtime via `getCurrentWindow().label`, render different components.

**Result**: Failed
- Timing issues with `getCurrentWindow().label` - main UI rendered before label was available
- Even with synchronous detection at module load, popup showed blank content

### Attempt 2: Separate HTML Entry with Solid.js

**Approach**: Create `popup.html` as separate Vite entry point with its own `PopupView.tsx` component.

**Files created**:
- `popup.html` - separate HTML entry
- `src/popup.tsx` - entry point
- `src/components/PopupView.tsx` - popup-specific component
- Updated `vite.config.ts` with multi-entry rollupOptions

**Result**: Failed
- Popup window appeared but content didn't render
- Events (`popup-triggered`, `translate-chunk`) didn't reach the frontend

### Attempt 3: Plain HTML/JS without Framework

**Approach**: Self-contained `popup.html` using esm.sh CDN for Tauri APIs, no Solid.js.

**Result**: Failed
- Same issue - popup appears but no content/translation displayed
- CDN imports too slow, missing initial events

## The Working Solution

**Single `index.html` + Hash Routing + Pull-based Invoke**

### Architecture

```
index.html#/main  → Main window (streaming translation)
index.html#/popup → Popup window (one-shot translation)
```

### Key Decisions

1. **Hash-based routing**: `window.location.hash` provides synchronous, immediate detection at module load time
2. **Pull-based invoke**: Frontend calls `invoke("quick_translate")` instead of waiting for events
3. **Single entry point**: No Vite multi-entry complexity

### Implementation

**Frontend (src/index.tsx)**:
```tsx
const hash = window.location.hash;
const isPopup = hash.startsWith("#/popup");
render(() => (isPopup ? <PopupView /> : <App />), root);
```

**Backend (lib.rs)**:
```rust
#[tauri::command]
async fn quick_translate(app: tauri::AppHandle, text: String) -> Result<String, String> {
    let api_key = settings::get_api_key(&app);
    let model = settings::get_model(&app);
    anthropic::translate_once(text, api_key, model).await
}
```

## Post-Implementation Issues

### Issue 1: First Launch Not Working

**Symptom**: First ⌘⌥J shows nothing, second shows untranslated text, clicking area triggers translation.

**Root Cause**: Tauri v2 webview JS doesn't load until window is first shown.

**Fix**: Preload popup at app startup by showing/hiding it off-screen:
```rust
if let Some(popup) = app.get_webview_window("popup") {
    let _ = popup.show();
    std::thread::sleep(std::time::Duration::from_millis(200));
    let _ = popup.hide();
}
```

### Issue 2: "Clipboard Empty" on 3rd Attempt

**Symptom**: After two successful translations, third attempt shows clipboard empty error.

**Root Cause**: Both `popup-shown` event and `onFocusChanged` fire simultaneously, causing race condition where second call reads clipboard before it's populated.

**Fix**: Added debounce mechanism:
```tsx
let lastTranslationTime = 0;
const DEBOUNCE_MS = 500;

const runTranslation = async () => {
  const now = Date.now();
  if (now - lastTranslationTime < DEBOUNCE_MS) return;
  lastTranslationTime = now;
  // ... translation logic
};
```

## Technical Debt

The current implementation relies on magic numbers (fixed delays) that may be fragile:

| Location | Value | Purpose | Risk |
|----------|-------|---------|------|
| `lib.rs` L177 | 150ms | Wait for clipboard after ⌘C | May fail on slow apps |
| `lib.rs` L191 | 200ms | Wait for JS preload | May fail on slow machines |
| `PopupView.tsx` L30 | 500ms | Debounce dual triggers | May block rapid translations |

### Root Causes

1. **Clipboard**: Time between ⌘C simulation and clipboard update is non-deterministic
2. **JS Load**: Tauri v2 hidden windows don't load webview JS
3. **Event Racing**: Both `popup-shown` event and `onFocusChanged` fire together

### Future Improvements

1. **Clipboard polling**: Detect clipboard changes instead of fixed delay
2. **Ready signal**: Frontend sends `invoke("popup_ready")` when loaded
3. **Single trigger**: Use only one trigger mechanism to eliminate debounce

## Remaining Issues

1. **Shortcut conflict**: ⌘⌥J conflicts with Finder, IntelliJ, and other apps
2. **Foreground issue**: Closing popup brings other app to foreground

## Lessons Learned

1. **Tauri v2 multi-window is tricky**: Hidden windows don't load JS; events may not reach webviews reliably
2. **Pull beats push**: Frontend invoking commands is more reliable than listening for events
3. **Hash routing is simple and synchronous**: No async timing issues unlike `getCurrentWindow().label`
4. **Document timing dependencies**: Magic numbers should be commented with WHY, RISK, and IMPROVEMENT notes

## Files Changed

| File | Changes |
|------|---------|
| `src-tauri/tauri.conf.json` | Added popup window config |
| `src-tauri/src/lib.rs` | Added quick_translate, close_popup, show_popup, shortcuts |
| `src-tauri/src/anthropic.rs` | Added translate_once (non-streaming) |
| `src-tauri/capabilities/default.json` | Added popup to windows list |
| `src/index.tsx` | Added hash routing |
| `src/components/PopupView.tsx` | New popup UI component |
