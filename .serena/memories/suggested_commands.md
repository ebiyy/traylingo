# TrayLingo Development Commands

## Daily Development

```bash
# Install all dependencies
pnpm install

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

## Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-api-key-here
```

## Vite Commands

```bash
# Frontend only development
pnpm dev

# Build frontend only
pnpm build

# Preview production build
pnpm preview
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
