# TrayLingo Development Guidelines

> **Note**: This file is for **Claude Code** (Anthropic's official CLI).

## Project Overview

TrayLingo is a macOS menu bar translation app built with Tauri v2, Solid.js, and Tailwind CSS v4.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build

# Type check
pnpm typecheck

# Lint & Format (Biome)
pnpm lint
pnpm lint:fix
pnpm format

# Rust checks
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml

# Tests
pnpm test              # Frontend tests (Vitest)
pnpm test:watch        # Watch mode
pnpm test:rust         # Rust tests
pnpm test:all          # All tests
```

## Project Structure

```
src/                    # Frontend (Solid.js + TypeScript)
src-tauri/              # Backend (Rust + Tauri)
docs/                   # Documentation
.github/                # GitHub Actions & templates
```

## Code Style

- **TypeScript**: Follow existing patterns, use TypeScript for all frontend code
- **Rust**: Run `cargo fmt` and `cargo clippy` before committing
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

## Testing Strategy

### When to Add/Update Tests

Propose adding tests when:
- **Pure functions added**: Utility functions, calculations, formatters
- **Business logic changes**: Pricing, validation, sanitization
- **Bug fixes**: Add regression test to prevent recurrence

### Test Locations

| Type | Location | Framework |
|------|----------|-----------|
| Frontend utils | `src/utils/*.test.ts` | Vitest |
| Rust unit tests | `src-tauri/src/*.rs` (`#[cfg(test)]`) | cargo test |

### Current Test Coverage

- **Rust**: `calculate_cost` in `anthropic.rs`
- **Frontend**: `formatText`, `isJapanese` in `src/utils/formatText.ts`

### What NOT to Test (for now)

- Tauri commands (require mocking AppHandle)
- UI components (small app, manual testing sufficient)
- E2E (complex setup, low ROI)

## Environment Setup

API key is configured via in-app Settings UI (gear icon). No `.env` file or environment variable fallback.

**Fallback policy**: Avoid fallback mechanisms by default. If a fallback seems necessary, explicitly propose it to the user first.

## OSS Contribution Guidelines

When suggesting changes, consider these OSS best practices:

### Documentation
- **Language**: English only. All documentation, code comments, and commit messages must be in English for global contributors.
- **Structure**: `docs/` contains architecture overview + specific technical topics
- **Principle**: Minimal docs - avoid internal memos or design notes; focus on "what" and "why"
- Keep README.md up to date with new features
- Update CONTRIBUTING.md for workflow changes
- Add screenshots/GIFs for UI changes

### Code Quality
- Ensure CI passes before merging (lint, typecheck, cargo check)
- Follow existing code patterns

### Self-Documenting Code

**Principle**: Code should explain itself. Use comments only when code alone cannot convey intent.

**When to write comments:**
- Non-obvious design decisions (use `WHY:`)
- Workarounds or temporary fixes (use `HACK:`)
- Important notes for future readers (use `NOTE:`)
- Planned improvements (use `TODO:`)

**Comment prefixes:**
| Prefix | Purpose | Example |
|--------|---------|---------|
| `WHY:` | Explains non-obvious decisions | `// WHY: Translate technical terms for accessibility` |
| `HACK:` | Temporary workaround | `// HACK: Delay needed due to race condition` |
| `NOTE:` | Important context | `// NOTE: This API returns null on first call` |
| `TODO:` | Future improvement | `// TODO: Add retry logic for network errors` |

**What NOT to comment:**
- Obvious code (e.g., `// increment counter` before `i++`)
- Already clear variable/function names
- Implementation details that code shows clearly

**Example (good):**
```rust
// WHY: Translate technical terms for accessibility
// Users who don't understand English need full translation, not preserved terms.
// Only proper nouns (product/service names) are kept unchanged.
let system_prompt = r#"..."#;
```

### Security
- Never commit API keys or secrets
- Review changes for potential security issues
- Update SECURITY.md for security-related changes

### Community
- Use clear, descriptive commit messages
- Reference issues in PRs when applicable
- Be welcoming to new contributors

## Checklist for Changes

When making significant changes, consider updating:
- [ ] README.md (if user-facing features change)
- [ ] CONTRIBUTING.md (if development workflow changes)
- [ ] TODO.md (mark completed items, add new ones)
- [ ] CHANGELOG.md (when releasing a new version)
- [ ] docs/ (if architecture or concepts change)
- [ ] Serena memories (if changes affect learned knowledge - see below)

## Serena Memory Management

Serena MCP stores project knowledge in `.serena/memories/`. These memory files are committed to the repository for shared knowledge. Personal config (`.serena/project.yml`) is gitignored.

When changes cause divergence from learned knowledge, propose updating the relevant memory files.

### When to Update Serena Memories

Propose `mcp__serena__edit_memory` or `mcp__serena__write_memory` when:
- **Commands change**: New scripts in package.json, new CLI tools (e.g., Biome added)
- **Structure changes**: New directories, file reorganization
- **Tech stack changes**: New dependencies, framework updates
- **Conventions change**: New linting rules, code style updates

### Memory Files Reference
| File | Update When |
|------|-------------|
| `suggested_commands.md` | Scripts/commands added or changed |
| `code_style_conventions.md` | Linting, formatting, or style rules change |
| `codebase_structure.md` | Directory structure or architecture changes |
| `project_overview.md` | Tech stack or major features change |
| `task_completion_checklist.md` | CI/CD or review process changes |
