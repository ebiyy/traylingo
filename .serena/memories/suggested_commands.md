# TrayLingo Development Commands

## Quick Start (New Contributors)

```bash
pnpm install      # Install Node dependencies
mise install      # Install dev tools (lefthook, taplo)
lefthook install  # Enable git hooks
pnpm tauri dev    # Start development
```

## Daily Development

```bash
# Run development mode (frontend + backend)
pnpm tauri dev

# Build for production
pnpm tauri build
# Output: src-tauri/target/release/bundle/
```

## Code Quality Checks

### TypeScript
```bash
# Type checking
pnpm typecheck
```

### Biome (Lint & Format)
```bash
# Check for lint issues
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format
```

### Rust
```bash
# Check for compilation errors
cargo check --manifest-path src-tauri/Cargo.toml

# Lint with clippy
cargo clippy --manifest-path src-tauri/Cargo.toml

# Format code
cargo fmt --manifest-path src-tauri/Cargo.toml

# Check formatting without modifying
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

## Testing

```bash
# Run frontend tests (Vitest)
pnpm test

# Watch mode for development
pnpm test:watch

# Run Rust tests
pnpm test:rust

# Run all tests (frontend + Rust)
pnpm test:all
```

## Environment Setup

API key is configured via in-app Settings UI (gear icon). Stored securely in macOS Keychain.
No environment variables or `.env` files needed.

## Vite Commands

```bash
# Frontend only development
pnpm dev

# Build frontend only
pnpm build

# Preview production build
pnpm preview
```

## Git Hooks (lefthook)

```bash
# Install lefthook
mise use -g lefthook  # or: brew install lefthook

# Install git hooks (run once after clone)
lefthook install

# Run pre-commit checks manually
lefthook run pre-commit
```

## Code Quality Tools

```bash
# knip: Find unused code/dependencies
pnpm knip

# cargo-deny: Vulnerability & license audit (runs in CI)
cargo deny check  # Run from src-tauri directory
# Config: src-tauri/deny.toml

# cargo-watch: Auto-rebuild on file changes
cargo watch -C src-tauri -x check
cargo watch -C src-tauri -x clippy

# taplo: TOML formatter
taplo fmt src-tauri/Cargo.toml
taplo fmt --check src-tauri/Cargo.toml
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Conventional commit examples
git commit -m "feat: add new translation feature"
git commit -m "fix: resolve clipboard issue"
git commit -m "docs: update README"
```

## System Commands (macOS/Darwin)

```bash
# List files
ls -la

# Find files
find . -name "*.rs"

# Search in files (prefer grep or rg)
grep -r "pattern" src/
rg "pattern" --type rust

# View directory tree
tree -L 2
```
