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

## Environment Setup

Copy `.env.example` to `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-api-key-here
```

## OSS Contribution Guidelines

When suggesting changes, consider these OSS best practices:

### Documentation
- **Language**: English-first for global contributors
- **Structure**: `docs/` contains architecture overview + specific technical topics
- **Principle**: Minimal docs - avoid internal memos or design notes; focus on "what" and "why"
- Keep README.md up to date with new features
- Update CONTRIBUTING.md for workflow changes
- Add screenshots/GIFs for UI changes

### Code Quality
- Ensure CI passes before merging (lint, typecheck, cargo check)
- Follow existing code patterns
- Add comments for complex logic

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
