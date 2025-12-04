# Contributing to TrayLingo

Thank you for your interest in contributing to TrayLingo! This document provides guidelines for contributing.

## Development Setup

### Prerequisites

- macOS 10.15+ (for development)
- [Rust](https://rustup.rs/) 1.70+
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/traylingo.git
   cd traylingo
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. Run in development mode:
   ```bash
   pnpm tauri dev
   ```

## Project Structure

```
traylingo/
├── src/                    # Frontend (Solid.js + TypeScript)
│   ├── App.tsx            # Main UI component
│   ├── index.tsx          # Entry point
│   └── index.css          # Styles (Tailwind)
├── src-tauri/             # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── lib.rs         # Tauri commands & app setup
│   │   ├── main.rs        # Entry point
│   │   └── openai.rs      # OpenAI API integration
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── docs/                   # Documentation
└── package.json           # Node.js dependencies
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all frontend code
- Follow existing patterns in the codebase

### Rust
- Run `cargo fmt` before committing
- Run `cargo clippy` to check for common issues

### Commits
- Write clear, concise commit messages
- Use conventional commits when possible (feat:, fix:, docs:, etc.)

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - macOS version and app version

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Discuss the implementation approach

### Submitting Pull Requests

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes:
   ```bash
   pnpm tauri dev
   ```

4. Commit your changes

5. Push and create a Pull Request

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add tests if applicable
- Ensure CI passes

## Platform Contributions

TrayLingo currently supports macOS only. We welcome contributions to add support for:

- **Linux**: X11/Wayland system tray integration
- **Windows**: Windows system tray support

If you're interested in adding platform support, please open an issue first to discuss the approach.

## Security

- **Never commit API keys or secrets**
- Report security vulnerabilities privately (see [SECURITY.md](SECURITY.md))

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
