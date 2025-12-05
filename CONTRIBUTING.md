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

2. Configure git (recommended):
   ```bash
   git config pull.rebase true
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up git hooks (recommended):
   ```bash
   # Install lefthook (choose one)
   mise use -g lefthook  # or: brew install lefthook

   # Install hooks
   lefthook install
   ```

5. Run in development mode:
   ```bash
   pnpm tauri dev
   ```

6. Configure API key:
   - Click the gear icon (⚙️) in the app footer
   - Enter your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

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
│   │   └── anthropic.rs   # Anthropic API integration
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

### Optional Tools

```bash
# cargo-watch: Auto-rebuild on file changes
cargo install cargo-watch
cargo watch -C src-tauri -x check

# taplo: TOML formatter (for Cargo.toml)
mise use -g taplo  # or: cargo install taplo-cli
taplo fmt src-tauri/Cargo.toml
```

### Commits
- Write clear, concise commit messages
- Use conventional commits when possible (feat:, fix:, docs:, etc.)

## Git Workflow

### Branch Strategy

- **`main`**: Protected branch, production-ready code only
- **`develop`**: Main development branch, PRs are merged here
- **Feature branches**: Create from `develop` for new work

### Recommended Git Config

Set rebase as default for pull to avoid merge commits:

```bash
git config pull.rebase true
```

This prevents divergent branch issues when pulling changes while you have local commits.

### Workflow Example

```bash
# Start new feature
git checkout develop
git pull
git checkout -b feature/your-feature

# Work on feature...
# When ready to push
git push -u origin feature/your-feature
# Create PR to develop
```

## Release Process

TrayLingo uses Git Flow release branches for version releases.

### Release Workflow

```
develop → release/vX.Y.Z → PR to main → tag → GitHub Release
                               ↓
                        merge back to develop
```

### Steps

1. **Create release branch** from `develop`: `release/v{version}`
2. **Bump versions** in all 3 files (must match):
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
3. **Update CHANGELOG.md**: Move `[Unreleased]` to `[version]`
4. **Create PR** to `main`
5. **After merge**: Tag `v{version}` (triggers release build)
6. **Merge back** to `develop`
7. **Delete** release branch

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{name}` | `feature/dark-mode` |
| Fix | `fix/issue-{n}` | `fix/issue-42` |
| Release | `release/v{version}` | `release/v0.2.0` |
| Hotfix | `hotfix/v{version}` | `hotfix/v0.2.1` |

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

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   pnpm test:all          # Frontend + Rust tests
   pnpm lint              # Lint check
   pnpm typecheck         # Type check
   cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
   ```

4. Test manually:
   ```bash
   pnpm tauri dev
   ```

5. Commit your changes

6. Push and create a Pull Request to `develop`

### PR Guidelines

- **Target `develop` branch** (not `main`)
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
