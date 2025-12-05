# TrayLingo Project Overview

## Purpose
TrayLingo is a macOS menu bar (system tray) application for instant translation powered by Anthropic Claude.
- **Name Origin**: Tray (system tray) + Lingo (language/words)
- **Target Platform**: macOS 10.15+ (currently macOS only)

## Key Features
- **Global Shortcuts**:
  - `⌘J` - Translate selected text (main window)
  - `⌃⌥J` - Quick popup translation
- **Streaming Translation**: Real-time translation display
- **Auto Language Detection**: Japanese ↔ English automatic detection
- **Code Block Preservation**: Technical content remains intact
- **Token Usage Tracking**: API cost monitoring per request/session
- **Menu Bar Integration**: Lives in system tray
- **Focus Restoration**: Automatically returns focus to previous app after popup closes
- **Settings UI**: In-app configuration (gear icon)
- **Cost Optimizations**:
  - Prompt Caching (Anthropic API) - 90% off cached system prompt tokens
  - Translation Cache (local) - same text returns instantly without API call
  - Optimized prompt (~150 tokens vs ~200 original)

## Tech Stack

### Frontend
- **Framework**: Solid.js
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Testing**: Vitest

### Backend
- **Framework**: Tauri v2
- **Language**: Rust (Edition 2021, minimum 1.77.2)
- **HTTP Client**: reqwest (with streaming)
- **Async Runtime**: tokio

### AI Integration
- **Provider**: Anthropic Claude API
- **Default Model**: claude-haiku-4-5-20251001
- **Supported Models**:
  - Claude Haiku 4.5 (claude-haiku-4-5-20251001)
  - Claude Sonnet 4.5 (claude-sonnet-4-5-20250514)
  - Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
  - Claude 3.5 Haiku (claude-3-5-haiku-20241022)
- **Pricing** (per 1M tokens):
  | Model | Input | Output |
  |-------|-------|--------|
  | Claude Haiku 4.5 | $1.0 | $5.0 |
  | Claude Sonnet 4.5 | $3.0 | $15.0 |
  | Claude 3.5 Sonnet | $3.0 | $15.0 |
  | Claude 3.5 Haiku | $0.8 | $4.0 |

### Key Dependencies

**Rust (src-tauri/Cargo.toml)**:
- tauri 2.x (with tray-icon, image-png features)
- tauri-plugin-global-shortcut
- tauri-plugin-clipboard-manager
- tauri-plugin-notification
- reqwest 0.12 (json, stream features)
- tokio (full features)
- sha2 0.10 (for translation cache hashing)
- objc2, objc2-app-kit (macOS specific)

**Node.js (package.json)**:
- @tauri-apps/api ^2.9.1
- @tauri-apps/plugin-clipboard-manager
- @tauri-apps/plugin-global-shortcut
- @tauri-apps/plugin-notification
- lucide-solid ^0.555.0
- solid-js ^1.9.10
- tailwindcss ^4.1.17
- typescript ^5.9.3
- vite ^7.2.6
- vitest ^4.0.15

## Package Manager
- **Node**: pnpm 10.24.0
- **Rust**: cargo (via rustup)
