# TrayLingo - Next Session Handoff

## Current Status

### Completed
- [x] Tauri v2 + Solid.js + Tailwind CSS v4 project setup
- [x] System tray with left-click toggle, right-click menu
- [x] Hybrid dock visibility (window visible = dock shown, hidden = dock hidden)
- [x] Window close → hide behavior (app stays resident)
- [x] Basic 2-pane UI scaffold

### Project Structure
```
traylingo/
├── src/                          # Frontend (Solid.js + Tailwind)
│   ├── App.tsx                   # Main 2-pane UI (placeholder)
│   ├── index.tsx
│   └── index.css
├── src-tauri/                    # Backend (Rust + Tauri v2)
│   ├── src/
│   │   ├── lib.rs                # Main app logic, tray, dock control
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/default.json # Permissions
├── package.json
└── vite.config.ts
```

### Installed Plugins (Ready to Use)
| Plugin | Purpose | Status |
|--------|---------|--------|
| `global-shortcut` | ⌘J hotkey | Installed, not wired |
| `clipboard-manager` | Read selected text | Installed, not wired |
| `notification` | Show translation result | Installed, not wired |
| `reqwest` | OpenAI API calls | In Cargo.toml |
| `tokio` | Async runtime | In Cargo.toml |
| `futures` | Stream handling | In Cargo.toml |

---

## Next Steps (Choose Order)

### Option 1: ⌘J Hotkey + Clipboard (Recommended First)
**Goal**: Press ⌘J anywhere → read clipboard → show window with text

**Files to modify**:
- `src-tauri/src/lib.rs` - Register global shortcut in setup
- `src/App.tsx` - Listen for events, display text

**Key APIs**:
```rust
// Rust: Register shortcut
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

let shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyJ);
app.global_shortcut().register(shortcut)?;
```

```typescript
// Frontend: Listen for clipboard
import { readText } from '@tauri-apps/plugin-clipboard-manager';
const text = await readText();
```

---

### Option 2: OpenAI Streaming API
**Goal**: Send text to OpenAI → stream translation back

**Files to modify**:
- `src-tauri/src/lib.rs` - Add translate command
- New: `src-tauri/src/openai.rs` - API client

**Key implementation**:
```rust
// Streaming with reqwest + SSE
use futures::StreamExt;
use reqwest::Client;

async fn translate_stream(text: &str, api_key: &str) -> impl Stream<Item = String> {
    // POST to https://api.openai.com/v1/chat/completions
    // with stream: true
}
```

**Environment**:
- API key via `OPENAI_API_KEY` env var or settings file

---

### Option 3: UI Implementation
**Goal**: Proper 2-pane layout with streaming text display

**Files to modify**:
- `src/App.tsx` - Full UI implementation

**Design spec** (from docs/thema.md):
- Left pane: Original text
- Right pane: Translation (streaming, grows as text arrives)
- Dark theme (gray-900 base)
- Accent: Subtle wine red / salmon

**Key Solid.js patterns**:
```typescript
// Streaming text display
const [translated, setTranslated] = createSignal("");

// Append streaming chunks
onTranslateChunk((chunk) => {
  setTranslated(prev => prev + chunk);
});
```

---

## Technical References

### Tauri v2 Event System
```rust
// Rust → Frontend
app.emit("translate-chunk", payload)?;

// Frontend listening
import { listen } from '@tauri-apps/api/event';
await listen('translate-chunk', (event) => { ... });
```

### Global Shortcut Registration
```rust
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Code, Modifiers};

app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
    // Handle ⌘J press
    show_window(app);
    // Read clipboard, start translation...
});
```

### OpenAI Chat Completion (Streaming)
```bash
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer $OPENAI_API_KEY
  Content-Type: application/json
Body:
{
  "model": "gpt-4o-mini",
  "stream": true,
  "messages": [
    {"role": "system", "content": "Translate to English if Japanese, or to Japanese if English. Only output the translation."},
    {"role": "user", "content": "翻訳するテキスト"}
  ]
}
```

---

## Commands

```bash
# Development
pnpm tauri dev

# Build
pnpm tauri build

# Check Rust
cd src-tauri && cargo check
```

---

## Known Issues / Notes

1. **Dock hiding in dev mode**: During `pnpm tauri dev`, removing from dock kills the process (expected, dev runs as subprocess)
2. **Tray icon**: Using default Tauri icon (32x32.png), replace with custom later
3. **Window starts visible**: Set `visible: true` in tauri.conf.json for easier testing

---

## Suggested Session Flow

1. **Quick win**: Implement ⌘J → clipboard → show in UI (no API yet)
2. **Core feature**: Add OpenAI streaming translation
3. **Polish**: UI styling, error handling, settings
