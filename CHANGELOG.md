# Changelog

All notable changes to TrayLingo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Add prompt injection prevention for translation input
  - System prompt hardened with strict translation-only rules
  - User input wrapped in delimiter tags to prevent instruction injection

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

[Unreleased]: https://github.com/ebiyy/traylingo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ebiyy/traylingo/releases/tag/v0.1.0
