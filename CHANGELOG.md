# Changelog

All notable changes to TrayLingo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-12-06

### Added

- Privacy policy and Sentry opt-out toggle in settings
- Popup appears near mouse cursor position
- External links open in system browser instead of WebView
- Unified logging layer for development debugging

### Fixed

- Global shortcut triggering twice (now only triggers on key press)
- Popup shortcut changed from ⌘⌥J to ⌃⌥J to avoid macOS conflicts
- Popup position validation within primary monitor bounds
- Focus restoration to previous app when popup closes
- Text selection visibility improvements
- Two-pane layout overflow issues

### Security

- Prompt injection prevention for translation input
  - System prompt hardened with strict translation-only rules
  - User input wrapped in delimiter tags to prevent instruction injection

### Changed

- CI: Added PR rules validation for main branch
- CI: Added npm license audit workflow

## [0.1.0] - 2025-01-XX

### Added

- Initial release of TrayLingo
- macOS menu bar integration with system tray
- Global shortcut (⌘J) for quick translation access
- Streaming translation powered by Claude AI (Anthropic)
- Automatic language detection (Japanese ↔ English)
- Real-time token usage tracking and cost estimation
- Clipboard integration for easy text input
- Local API key storage via `tauri-plugin-store`

### Technical

- Built with Tauri v2, Solid.js, and Tailwind CSS v4
- TypeScript frontend with Rust backend
- Biome for linting and formatting

[Unreleased]: https://github.com/ebiyy/traylingo/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/ebiyy/traylingo/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ebiyy/traylingo/releases/tag/v0.1.0
