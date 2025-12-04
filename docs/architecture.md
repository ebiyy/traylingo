# Architecture

## Overview

TrayLingo is a macOS menu bar translation app built with:

- **Tauri v2** - Cross-platform app framework
- **Solid.js** - Reactive UI framework
- **Rust** - Backend logic and system integration
- **OpenAI API** - Streaming translation via GPT-4o-mini

## UX Flow

```
1. Select text     →  User highlights text in any app
2. Press ⌘J        →  Global shortcut triggers translation
3. Auto-copy       →  Selected text copied to clipboard
4. Detect language →  Japanese ↔ English auto-detection
5. Stream translate→  OpenAI streaming API call
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
│       └── openai.rs       # OpenAI API client
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

### `openai.rs` - OpenAI Integration

| Component | Description |
|-----------|-------------|
| `translate_stream` | Streaming API call to OpenAI |
| `sanitize_input` | Clean input text (see [Input Sanitization](input-sanitization.md)) |
| `calculate_cost` | Token usage cost calculation |
| `ChatRequest` | API request structure |
| `ChatChunk` | Streaming response chunk |
| `UsageInfo` | Token usage tracking |

## OpenAI Integration

### API Configuration

- **Endpoint**: `/v1/chat/completions`
- **Model**: `gpt-4o-mini` (configurable)
- **Streaming**: Server-Sent Events (SSE)

### System Prompt

The translation prompt is designed to:
- Output translation only (no explanations)
- Preserve code blocks and technical content
- Auto-detect source language (Japanese ↔ English)

### Token Pricing

| Type | Cost |
|------|------|
| Input | $0.15 / 1M tokens |
| Output | $0.60 / 1M tokens |

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
