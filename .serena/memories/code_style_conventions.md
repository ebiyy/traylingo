# TrayLingo Code Style & Conventions

## TypeScript Conventions

### Biome (Linter & Formatter)
- **Tool**: Biome v2 (`@biomejs/biome`)
- **Commands**:
  - `pnpm lint` - Check for issues
  - `pnpm lint:fix` - Auto-fix issues
  - `pnpm format` - Format code
- **Config**: `biome.json`

### tsconfig.json Settings
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: preserve (jsxImportSource: solid-js)
- **Strict Mode**: Enabled
- **No Unused Locals/Parameters**: Enforced
- **No Fallthrough Cases**: Enforced

### General Guidelines
- Use TypeScript for all frontend code
- Follow existing patterns in the codebase
- Use ES modules (`import`/`export`)

### Solid.js Specific
- Use reactive primitives (`createSignal`, `createEffect`)
- Components use `.tsx` extension
- Entry point: `src/index.tsx`
- Main component: `src/App.tsx`

## Rust Conventions

### Cargo Settings
- **Edition**: 2021
- **Minimum Rust Version**: 1.77.2
- **Crate Types**: staticlib, cdylib, rlib

### Code Style
- Run `cargo fmt` before committing
- Run `cargo clippy` for linting
- Use `serde` for serialization
- Use `tokio` for async operations

### Project Structure
- `lib.rs`: Tauri commands and app setup
- `main.rs`: Entry point
- `openai.rs`: OpenAI API integration

### Naming Conventions
- Functions: `snake_case` (e.g., `translate_stream`, `toggle_window`)
- Structs: `PascalCase` (e.g., `ChatRequest`, `UsageInfo`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `INPUT_PRICE_PER_MILLION`)

## Self-Documenting Code

**Principle**: Code should explain itself. Use comments only when code alone cannot convey intent.

**Comment Prefixes:**
| Prefix | Purpose |
|--------|---------|
| `WHY:` | Non-obvious design decisions |
| `HACK:` | Temporary workaround |
| `NOTE:` | Important context |
| `TODO:` | Future improvement |

**When to comment:**
- Non-obvious decisions (WHY)
- Workarounds (HACK)
- Important context (NOTE)
- Planned improvements (TODO)

**When NOT to comment:**
- Obvious code
- Already clear variable/function names
- Implementation details that code shows clearly

## Git Workflow

### Branch Strategy
- **`main`**: Protected branch, production-ready code only
- **`develop`**: Main development branch, PRs are merged here
- **Feature branches**: Create from `develop` for new work

### Pull Configuration
- **Rebase by default**: `pull.rebase true` is configured for this repo
- This prevents divergent branch issues when pulling with local commits

### PR Target
- Always target `develop` branch (not `main`)
- Exception: Release branches target `main`

### Release Branch Workflow
- **Create**: `release/v{version}` from `develop`
- **Purpose**: Version bump, CHANGELOG update, final testing
- **Merge**: To `main` (squash), then back to `develop`
- **Tag**: After merge to main, triggers release build

### Version Files (must all match)
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

## Commit Conventions

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

Example: `feat: add streaming translation support`

## Security Guidelines

- **NEVER** commit API keys or secrets
- API key is configured via in-app Settings UI (no `.env` file)
- Settings stored locally via `tauri-plugin-store`
- Review changes for security issues before committing
