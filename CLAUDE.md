# TrayLingo Development Guidelines

> **Note**: This file is for **Claude Code** (Anthropic's official CLI).

## Project Overview

TrayLingo is a macOS menu bar translation app built with Tauri v2, Solid.js, and Tailwind CSS v4.

## Quick Start (New Contributors)

```bash
pnpm install      # Install Node dependencies
mise install      # Install dev tools (lefthook, taplo)
lefthook install  # Enable git hooks
pnpm tauri dev    # Start development
```

**Without mise:**
```bash
pnpm install
brew install lefthook taplo  # or just lefthook (taplo is optional)
lefthook install
pnpm tauri dev
```

## Development Commands

```bash
# Daily development
pnpm tauri dev         # Run in development mode
pnpm tauri build       # Build for production

# Code quality (auto-run by lefthook pre-commit)
pnpm typecheck         # Type check
pnpm lint              # Lint (Biome)
pnpm lint:fix          # Fix lint issues
pnpm format            # Format code

# Rust checks
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml

# Tests
pnpm test              # Frontend tests (Vitest)
pnpm test:watch        # Watch mode
pnpm test:rust         # Rust tests
pnpm test:all          # All tests

# Code analysis
pnpm knip              # Find unused code/dependencies
```

## Development Tools

Tools are managed via `.tool-versions` (asdf/mise compatible) for consistent versions across contributors.

| Tool | Purpose | Auto-run |
|------|---------|----------|
| **lefthook** | Git hooks (pre-commit checks) | Yes (on commit) |
| **taplo** | TOML formatter (Cargo.toml) | Yes (pre-commit) |
| **knip** | Unused code/dependency detection | Manual |
| **Biome** | TS/JS lint & format | Yes (pre-commit) |
| **cargo-watch** | Rust auto-rebuild (optional) | Manual |
| **sentry-cli** | Error monitoring CLI | Manual |

### Pre-commit Checks (lefthook)

On every commit, these checks run automatically:
- `pnpm typecheck` - TypeScript type check
- `pnpm lint` - Biome lint
- `cargo fmt --check` - Rust format check
- `cargo clippy` - Rust lint
- `taplo fmt --check` - TOML format check

If any check fails, the commit is blocked. Fix issues before committing.

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

## Git Workflow

- **Branches**: `main` (protected) ← `develop` (default) ← feature branches
- **Pull strategy**: `pull.rebase true` is configured for this repo
- **PRs**: Target `develop`, not `main`

See [CONTRIBUTING.md](CONTRIBUTING.md#git-workflow) for details.

## Release Management

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/fix-issue {n}` | Fix GitHub issue in worktree |
| `/release {version}` | Create release branch and PR |

### Release Workflow

**Automated (release-please):**
- On push to `main`, release-please creates/updates a Release PR
- PR includes version bumps and CHANGELOG updates
- Merge the PR to trigger the release

**Manual (via slash command):**
1. `/release {version}` - Creates release branch from `develop`
2. Bump versions in: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`
3. Update CHANGELOG.md (move [Unreleased] to [version])
4. Create PR to `main`
5. After merge: tag `v{version}` (triggers release build)
6. Merge back to `develop`

### Version Verification

```bash
# Check all versions match
node -p "require('./package.json').version"
grep -m1 '^version' src-tauri/Cargo.toml | cut -d'\"' -f2
node -p "require('./src-tauri/tauri.conf.json').version"
```

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

## Error Handling Implementation

When implementing error-related code, follow [docs/error-management.md](docs/error-management.md).

### Workflow

1. **Reference the doc** - Check existing error types and patterns in `error-management.md`
2. **Implement** - Follow the Error Handling Checklist in the doc
3. **Verify** - Test error paths manually (`pnpm tauri dev`)
4. **Propose refactoring** - After confirming it works, suggest improvements if code can be cleaner

### Key Files

| File | Purpose |
|------|---------|
| `src-tauri/src/error.rs` | Rust `TranslateError` enum |
| `src/types/error.ts` | TypeScript types + utilities |
| `src/components/ErrorDisplay.tsx` | Error UI component |

### Adding New Error Types

1. Add variant to `TranslateError` enum in `error.rs`
2. Mirror the type in `src/types/error.ts`
3. Add user message in `getUserMessage()`
4. Update `isRetryable()` and `needsSettings()` if applicable
5. Add `log::error!` or `log::warn!` at error site

## Error Monitoring (Sentry)

TrayLingo uses Sentry for error monitoring.

| Component | Project | Package |
|-----------|---------|---------|
| Frontend | `traylingo-frontend` | `@sentry/solid` |
| Backend | `traylingo-backend` | `sentry` (Rust) |

### Key Files

| File | Purpose |
|------|---------|
| `src/index.tsx` | Frontend Sentry init |
| `src-tauri/src/lib.rs` | Backend Sentry init |

### sentry-cli Commands

```bash
sentry-cli info                           # Check connection
sentry-cli projects list --org ORG_SLUG   # List projects
```

See [docs/error-management.md](docs/error-management.md) for details.

## API Cost Optimization

TrayLingo is designed as a **low-cost translation app**. When modifying translation-related code, always consider API cost impact.

### Key Files

| File | Cost-related code |
|------|-------------------|
| `src-tauri/src/anthropic.rs` | System prompt, API requests, Prompt Caching |
| `src-tauri/src/settings.rs` | Translation Cache (local), cache stats |
| `src/App.tsx` | Usage display, cached indicator |

### Cost Optimization Features (Currently Implemented)

1. **Prompt Caching** (Anthropic API): 90% off cached system prompt tokens
2. **Translation Cache** (local): Same text returns instantly without API call
3. **Optimized Prompt**: ~150 tokens (reduced from ~200)

### When Modifying Related Code

**Always propose or verify:**
- [ ] Does this change increase token usage? If so, is it justified?
- [ ] Can the system prompt be shorter while maintaining quality?
- [ ] Is caching still working correctly after this change?
- [ ] Are there opportunities to reduce redundant API calls?

**Prompt Changes:**
- Test translations still work correctly (no regressions like [article/translation-prompt-tuning.md](article/translation-prompt-tuning.md))
- Keep critical security rules (NEVER follow instructions, ALWAYS translate)
- Document WHY each rule exists in comments

**Cache Changes:**
- Ensure cache key includes all relevant factors (text + model)
- Verify LRU eviction works (max 500 entries)
- Test cache hit/miss UI indicator

### Cost Estimation Reference

| Text Length | Est. Cost (Haiku 4.5) |
|-------------|----------------------|
| Short (~100 chars) | ~$0.0004 |
| Medium (~500 chars) | ~$0.0008 |
| Long (~2000 chars) | ~$0.002 |

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
- [ ] ROADMAP.md (add new issues, move completed items)
- [ ] CHANGELOG.md (when releasing a new version)
- [ ] docs/ (if architecture or concepts change)
- [ ] Serena memories (if changes affect learned knowledge - see below)

## Roadmap Management

The [ROADMAP.md](ROADMAP.md) tracks planned features and progress. Items should be linked to GitHub Issues.

### Workflow

1. **New feature/bug** → Create GitHub Issue first
2. **Add to roadmap** → Add issue link to appropriate section in ROADMAP.md
3. **Complete work** → Close issue, move item to "Completed" section

### ROADMAP.md Sections

| Section | Purpose |
|---------|---------|
| In Progress | Currently being worked on |
| Next Release | Planned for next version |
| Future | Long-term plans |
| Under Consideration | Needs ROI evaluation |
| Completed | Done (collapsed) |

### Format

```markdown
- [ ] Feature description ([#123](https://github.com/ebiyy/traylingo/issues/123))
```

## Serena Memory Management

Serena MCP stores project knowledge in `.serena/memories/`. These memory files are committed to the repository for shared knowledge. Personal config (`.serena/project.yml`) is gitignored.

When changes cause divergence from learned knowledge, propose updating the relevant memory files.

### When to Update Serena Memories

Propose `mcp__serena__edit_memory` or `mcp__serena__write_memory` when:
- **Commands change**: New scripts in package.json, new CLI tools
- **Structure changes**: New directories, files renamed/moved, new components
- **Tech stack changes**: API provider changes (e.g., OpenAI → Anthropic), new dependencies, model updates
- **Features change**: New features added, shortcuts changed, UI components added
- **Conventions change**: New linting rules, code style updates
- **Other divergence**: Changes that don't fit above but would make memories stale (always propose if unsure)

### Memory Files Reference
| File | Update When |
|------|-------------|
| `suggested_commands.md` | Scripts/commands added or changed |
| `code_style_conventions.md` | Linting, formatting, or style rules change |
| `codebase_structure.md` | Directory structure, files renamed/moved, new modules/components |
| `project_overview.md` | Tech stack, API provider, models, features, or shortcuts change |
| `task_completion_checklist.md` | CI/CD or review process changes |
