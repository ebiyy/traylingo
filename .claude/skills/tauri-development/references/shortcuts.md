# Global Shortcuts

## The Hidden Conflict Problem

Shortcut conflicts can manifest as unrelated errors:

```
クリップボードにテキストがありません。
```

When clipboard works with one shortcut (⌘J) but fails with another (⌘⌥J), suspect conflicts—not code bugs.

## Why This Happens

```
User presses ⌘⌥J
  → Chrome intercepts: DevTools opens (⌘⌥J is Chrome's JS Console)
  → TrayLingo's simulate_copy() runs
  → But focus has moved to DevTools
  → Clipboard read fails
  → "No text in clipboard" error
```

## Safe Modifier Combinations

| Combination | Safety | Notes |
|-------------|--------|-------|
| ⌘⌥ + key | Low | Chrome DevTools, many apps |
| ⌘⇧ + key | Medium | Commonly used |
| ⌃⌘ + key | Medium | Some apps (e.g., Lunar) |
| **⌃⌥ + key** | **High** | Rarely used anywhere |
| ⌃⇧⌘ + key | High | Too complex, avoided |

**Recommendation:** Start with ⌃⌥ (Control+Option).

## Detecting Conflicts

If behavior varies by app:
- Works in Safari, fails in Chrome → Chrome-specific shortcut
- Works in VSCode, fails in Lunar → Check Lunar settings

## Modifier Key Interference

When simulating ⌘C from ⌘⌥J, Option is still held. Some apps interpret this as ⌘⌥C.

### Solution: Release Modifiers First

```applescript
tell application "System Events"
    key up {option, shift, control}
    keystroke "c" using command down
end tell
```

## Debugging Tips

1. **"Works sometimes"** = conflict with specific apps
2. **"Clipboard empty"** after shortcut = focus shifted elsewhere
3. **Different results by app** = app-specific shortcut collision

## Example: VSCode WebView Issue

VSCode webview panels may copy internal IDs instead of selected text when modifier keys interfere. Solution: Always release interfering modifiers before simulating keystrokes.
