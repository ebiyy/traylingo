# Architecture

## Overview

TrayLingo is a macOS menu bar translation app built with:

- **Tauri v2** - Cross-platform app framework
- **Solid.js** - Reactive UI framework
- **Rust** - Backend logic and system integration
- **Anthropic API** - Streaming translation via Claude Haiku

## UX Flow

```
1. Select text     →  User highlights text in any app
2. Press ⌘J        →  Global shortcut triggers translation
3. Auto-copy       →  Selected text copied to clipboard
4. Detect language →  Japanese ↔ English auto-detection
5. Stream translate→  Anthropic streaming API call
6. Display result  →  Real-time result in UI
```

## Project Structure

```
traylingo/
├── src/                    # Frontend (Solid.js + TypeScript)
│   ├── App.tsx             # Main UI component
│   ├── index.tsx           # Entry point
│   └── index.css           # Tailwind styles
├── src-tauri/              # Backend (Rust)
│   └── src/
│       ├── main.rs         # App entry point
│       ├── lib.rs          # Core logic & Tauri commands
│       └── anthropic.rs    # Anthropic API client
└── docs/                   # Documentation
```

## Backend Modules

### `lib.rs` - Core Application

| Function | Description |
|----------|-------------|
| `translate` | Tauri command - orchestrates translation flow |
| `toggle_window` | Show/hide the app window |
| `show_window` / `hide_window` | Window visibility control |
| `run` | Initialize and run the Tauri app |

### `anthropic.rs` - Anthropic Integration

| Component | Description |
|-----------|-------------|
| `translate_stream` | Streaming API call to Anthropic |
| `sanitize_input` | Clean input text (see [Input Sanitization](input-sanitization.md)) |
| `calculate_cost` | Token usage cost calculation |
| `MessageRequest` | API request structure |
| `StreamEvent` | Streaming response event |
| `UsageInfo` | Token usage tracking |

## Anthropic Integration

### API Configuration

- **Endpoint**: `/v1/messages`
- **Model**: `claude-haiku-4-5-20251001` (configurable)
- **Streaming**: Server-Sent Events (SSE)

### System Prompt

The translation prompt is designed to:
- Output translation only (no explanations)
- Preserve code blocks and technical content
- Auto-detect source language (Japanese ↔ English)

### Token Pricing (Claude Haiku 4.5)

| Type | Cost |
|------|------|
| Input | $1.00 / 1M tokens |
| Output | $5.00 / 1M tokens |

## Frontend Architecture

### Solid.js Components

The UI is a single-page app with:
- Two-pane layout (original / translated)
- Real-time streaming display
- Token usage indicator
- System tray integration

### Tauri Bridge

Frontend communicates with Rust backend via:
- `invoke('translate', { text })` - Trigger translation
- Event listeners for streaming chunks

## Configuration

### API Key

Configured via in-app Settings UI (gear icon). Stored locally via `tauri-plugin-store`.

### Build Configuration

- `tauri.conf.json` - Tauri app settings
- `vite.config.ts` - Frontend build settings
- `Cargo.toml` - Rust dependencies

## Related Documentation

- [Input Sanitization](input-sanitization.md) - Unicode handling for translations
