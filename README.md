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
2. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

### Translating Text

1. Select any text in any application
2. Press `Cmd+J`
3. TrayLingo will automatically copy the selected text, translate it, and display the result

### Controls

- **Left-click** on tray icon: Toggle window visibility
- **Right-click** on tray icon: Open menu (Quit)
- **Cmd+J**: Translate selected text

## Tech Stack

- **Framework**: [Tauri v2](https://tauri.app/)
- **Frontend**: [Solid.js](https://www.solidjs.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: Rust
- **AI**: Claude Haiku 4.5 (Anthropic)

## Configuration

TrayLingo uses the `claude-haiku-4-5-20251001` model. Token pricing:
- Input: $1 / 1M tokens
- Output: $5 / 1M tokens

## Documentation

- [Architecture](docs/architecture.md) - System design and module structure

Documentation is written in English to welcome global contributors. We keep docs minimal: architecture overview + specific technical topics only.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

### Platform Support

Currently macOS only. Contributions to add Linux and Windows support are especially welcome!

## License

[MIT](LICENSE)

## Acknowledgments

Built with [Tauri](https://tauri.app/), [Solid.js](https://www.solidjs.com/), and [Anthropic Claude](https://www.anthropic.com/).
