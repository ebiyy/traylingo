# Task Completion Checklist

## Before Committing

### Code Quality Checks (REQUIRED)
```bash
# 1. TypeScript type check
pnpm typecheck

# 2. Biome lint & format
pnpm lint
pnpm format

# 3. Rust checks
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml

# 4. Rust formatting
cargo fmt --manifest-path src-tauri/Cargo.toml

# 5. Run tests
pnpm test:all
```

### Manual Testing
- [ ] Run `pnpm tauri dev` and test changes
- [ ] Test `Cmd+J` shortcut functionality
- [ ] Verify UI renders correctly
- [ ] Check streaming translation works

## Documentation Updates

Consider updating these files if relevant:
- [ ] `README.md` - User-facing feature changes
- [ ] `CONTRIBUTING.md` - Development workflow changes
- [ ] `ROADMAP.md` - Mark completed items, add new ones
- [ ] `docs/` - Architecture or concept changes

## Commit Guidelines

1. Use conventional commit format
2. Write clear, concise commit messages
3. Reference issues when applicable

## Pull Request Checklist

- [ ] Code compiles without errors
- [ ] All checks pass (typecheck, cargo check, clippy)
- [ ] Code is properly formatted (cargo fmt)
- [ ] No API keys or secrets committed
- [ ] Documentation updated if needed
- [ ] PR has clear description

## Security Review

- [ ] No hardcoded credentials
- [ ] No sensitive data in logs
- [ ] Environment variables used for secrets
