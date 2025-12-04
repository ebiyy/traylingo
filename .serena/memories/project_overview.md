# TrayLingo Project Overview

## Purpose
TrayLingo is a macOS menu bar (system tray) application for instant translation powered by OpenAI.
- **Name Origin**: Tray (system tray) + Lingo (language/words)
- **Target Platform**: macOS 10.15+ (currently macOS only)

## Key Features
- **Global Shortcut**: `Cmd+J` to translate selected text
- **Streaming Translation**: Real-time translation display
- **Auto Language Detection**: Japanese ↔ English automatic detection
- **Code Block Preservation**: Technical content remains intact
- **Token Usage Tracking**: API cost monitoring per request/session
- **Menu Bar Integration**: Lives in system tray

## Tech Stack

### Frontend
- **Framework**: Solid.js
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Build Tool**: Vite 7

### Backend
- **Framework**: Tauri v2
- **Language**: Rust (Edition 2021, minimum 1.77.2)
- **HTTP Client**: reqwest (with streaming)
- **Async Runtime**: tokio

### AI Integration
- **Provider**: OpenAI API
- **Model**: gpt-4o-mini
- **Pricing**:
  - Input: $0.15 / 1M tokens
  - Output: $0.60 / 1M tokens

### Key Dependencies

**Rust (src-tauri/Cargo.toml)**:
- tauri 2.x (with tray-icon, image-png features)
- tauri-plugin-global-shortcut
- tauri-plugin-clipboard-manager
- tauri-plugin-notification
- reqwest 0.12 (json, stream features)
- tokio (full features)
- objc2, objc2-app-kit (macOS specific)

**Node.js (package.json)**:
- @tauri-apps/api ^2.9.1
- @tauri-apps/plugin-clipboard-manager
- @tauri-apps/plugin-global-shortcut
- @tauri-apps/plugin-notification
- solid-js ^1.9.10
- tailwindcss ^4.1.17
- typescript ^5.9.3
- vite ^7.2.6

## Package Manager
- **Node**: pnpm 10.24.0
- **Rust**: cargo (via rustup)
