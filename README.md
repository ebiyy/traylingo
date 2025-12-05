# TrayLingo

A lightweight macOS menu bar app for instant translation powered by Claude AI.

**Tray** (system tray) + **Lingo** (language/words) = TrayLingo

![TrayLingo Screenshot](docs/screenshot.png)

## Features

- **Global Shortcut**: Press `Cmd+J` to translate selected text instantly
- **Streaming Translation**: See translations appear in real-time
- **Auto Language Detection**: Automatically translates Japanese to English and vice versa
- **Code Block Preservation**: Technical content and code blocks remain intact
- **Token Usage Tracking**: Monitor API usage and costs per request and session
- **Menu Bar Integration**: Lives quietly in your system tray

## Installation

### Prerequisites

- macOS 10.15+
- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (20+)
- [pnpm](https://pnpm.io/) (10+)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/ebiyy/traylingo.git
cd traylingo

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Usage

### Setup

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
2. Launch TrayLingo and click the gear icon (⚙️) to open Settings
3. Enter your API key and select your preferred model

### Translating Text

1. Select any text in any application
2. Press `Cmd+J`
3. TrayLingo will automatically copy the selected text, translate it, and display the result

### Controls

- **Left-click** on tray icon: Toggle window visibility
- **Right-click** on tray icon: Open menu (Quit)
- **Cmd+J**: Translate selected text (main window)
- **Cmd+Option+J**: Quick translate popup (minimal UI, auto-closes)

### Troubleshooting

If an error occurs, click the **"Copy Report"** button to copy error details. You can paste this directly into a [GitHub Issue](https://github.com/ebiyy/traylingo/issues) for support.

## Tech Stack

- **Framework**: [Tauri v2](https://tauri.app/)
- **Frontend**: [Solid.js](https://www.solidjs.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: Rust
- **AI**: Claude Haiku 4.5 (Anthropic)

## Configuration

Available models (configurable in Settings):
| Model | Speed | Input | Output |
|-------|-------|-------|--------|
| Claude Haiku 4.5 (default) | Fast | $1/1M | $5/1M |
| Claude Sonnet 4.5 | Best | $3/1M | $15/1M |
| Claude 3.5 Sonnet | Good | $3/1M | $15/1M |
| Claude 3.5 Haiku | Fast | $0.8/1M | $4/1M |

Your API key and settings are stored locally on your device.

## Documentation

- [Architecture](docs/architecture.md) - System design and module structure
- [Error Management](docs/error-management.md) - Error handling strategy and logging
- [Roadmap](ROADMAP.md) - Planned features and progress

Documentation is written in English to welcome global contributors. We keep docs minimal: architecture overview + specific technical topics only.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

### Platform Support

Currently macOS only. Contributions to add Linux and Windows support are especially welcome!

## License

[MIT](LICENSE)

## Acknowledgments

Built with [Tauri](https://tauri.app/), [Solid.js](https://www.solidjs.com/), and [Anthropic Claude](https://www.anthropic.com/).
