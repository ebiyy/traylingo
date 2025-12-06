# Changelog

All notable changes to TrayLingo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2025-12-06)


### Features

* add /fix-issue slash command for automated issue handling ([f0cdba1](https://github.com/ebiyy/traylingo/commit/f0cdba1e69766232a70bfe0182ea2bfa77a007db))
* add animation effects for streaming translation ([117edc4](https://github.com/ebiyy/traylingo/commit/117edc4bdebaf292afd9f1f05305352ce7b7df71))
* add animation effects for streaming translation ([e29f044](https://github.com/ebiyy/traylingo/commit/e29f044a69164bc799ef802c75ab34eb9736b3d9))
* add auto-translate with debounce and editable textarea ([97260b6](https://github.com/ebiyy/traylingo/commit/97260b682b2e340bca67584a843ce0125115191d))
* add Biome linter/formatter and rustfmt configuration ([625e9fb](https://github.com/ebiyy/traylingo/commit/625e9fb81acab636b68bf1090fca6d5a482db7e8))
* add Copy Report button for GitHub Issue reporting ([c3f089c](https://github.com/ebiyy/traylingo/commit/c3f089c9c45f637a40ef8eb1bd7fd8e6da528072))
* add custom TrayLingo app and menu bar icons ([73b5e06](https://github.com/ebiyy/traylingo/commit/73b5e06d1ffa4b149305e3ddef63decc0f28b6ab))
* add error handling and settings UI with tauri-plugin-store ([280dfd7](https://github.com/ebiyy/traylingo/commit/280dfd77143c35e92962ab6fc65001b2925dcf8c))
* add global shortcut and OpenAI streaming translation ([b22c506](https://github.com/ebiyy/traylingo/commit/b22c506afae7274f838f22c0cfefb9a3b105dc53))
* add incomplete response detection and error history storage ([3e5cd7d](https://github.com/ebiyy/traylingo/commit/3e5cd7d77098af20392077fe2f4285e53a147d65))
* add OSS documentation and GitHub Actions workflows ([824d3a2](https://github.com/ebiyy/traylingo/commit/824d3a26780f98f12ff28d6026fef3b9466fb751))
* add quick translate popup (⌘⇧J) ([2300fa2](https://github.com/ebiyy/traylingo/commit/2300fa27889de3ef5ecd6b261e8bcb9eb435396c))
* add Serena MCP onboarding and memory management ([3e086f5](https://github.com/ebiyy/traylingo/commit/3e086f567e78f3dbe9288ebb96e6674b6a989bc2))
* add skeleton loading indicator and migrate to lucide-solid icons ([fc4f648](https://github.com/ebiyy/traylingo/commit/fc4f648618a053cdd158220fff39ed1a1f16950e))
* add Tauri backend with system tray and dock integration ([f025b97](https://github.com/ebiyy/traylingo/commit/f025b97b39b64fd7f7e6d767bde499bb6d2545d7))
* add UI polish, token tracking, and cost estimation ([ed02b8e](https://github.com/ebiyy/traylingo/commit/ed02b8ecd795b00aadab2236aaa3fbca6fce8e34))
* add window position memory ([947a2fd](https://github.com/ebiyy/traylingo/commit/947a2fd980f283e9c4b62400668fe7db5a64dd7e))
* change Quick Popup shortcut to ⌘⌥J and add screenshots ([36edf79](https://github.com/ebiyy/traylingo/commit/36edf79050fd3e73a2bd5ce69335f32c425c71ae))
* improve error handling with logging and structured errors ([a02685e](https://github.com/ebiyy/traylingo/commit/a02685e694622eea8f58eb5900e5a00fcd17d691))
* initialize Tauri v2 project with Solid.js and Tailwind CSS ([f461ee2](https://github.com/ebiyy/traylingo/commit/f461ee29b539bb8ee3b74750190016a38a0c9246))
* switch from OpenAI to Anthropic Claude Haiku 4.5 ([9162ea6](https://github.com/ebiyy/traylingo/commit/9162ea6b7d800b001ea8a0f688288a7b6aee2255))


### Bug Fixes

* **ci:** correct rust-toolchain action name ([9cdf25d](https://github.com/ebiyy/traylingo/commit/9cdf25d47c85f0914140ef0517ec4940324f419f))
* **ci:** remove duplicate pnpm version specification ([642bc39](https://github.com/ebiyy/traylingo/commit/642bc3996f61896de30106d60bd3e8564690e038))
* **ci:** remove duplicate pnpm version specification ([53894b3](https://github.com/ebiyy/traylingo/commit/53894b3c2ed6c2d1599fd21f7acac09d83693eef))
* ensure Rust panics are captured by Sentry before process abort ([68f9a3c](https://github.com/ebiyy/traylingo/commit/68f9a3cedcc90a658058056b9a85af73c50b2e0a))
* improve translation prompt to always translate text ([73409ff](https://github.com/ebiyy/traylingo/commit/73409ff55dce1ceb29f42c75ee77bde9cc174512))
* prevent duplicate panic events in Sentry ([8359c24](https://github.com/ebiyy/traylingo/commit/8359c24426201241e0b85a0a6a951bad675cc5de))
* prevent translation stream interleaving with session ID ([1fffe4c](https://github.com/ebiyy/traylingo/commit/1fffe4cc15c26146ec8ecb6ba9efc513ea116af8))
* release modifier keys before simulating ⌘C ([6d39f58](https://github.com/ebiyy/traylingo/commit/6d39f580aa3927e001adf8f11a696619bcb820c6))
* remove unused message_stopped assignment ([d0c4180](https://github.com/ebiyy/traylingo/commit/d0c4180d73fe3959683c0463e403b6cecc51ec5c))
* **security:** prevent prompt injection in translation ([a119236](https://github.com/ebiyy/traylingo/commit/a1192362d06340d98550c8c6b18b24e5027674dc))
* update release notes to reference Anthropic API key ([36b3a4c](https://github.com/ebiyy/traylingo/commit/36b3a4c0769ddeda27c95376289e9b255ee581a6))

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
