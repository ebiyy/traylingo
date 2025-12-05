---
description: Fix a GitHub Issue - create branch, implement fix, and open PR
---

Fix GitHub Issue #$ARGUMENTS.

## Steps

1. First, run `gh issue view $ARGUMENTS` to understand the issue
2. Create a `fix/issue-$ARGUMENTS` branch
3. Implement the fix (add tests if needed)
4. Run appropriate checks based on changed files:
   - TypeScript/Frontend: `pnpm lint` `pnpm typecheck`
   - Rust/Backend: `cargo fmt --check` `cargo clippy`
   - Run both if both areas are modified
5. Commit using conventional commits format
6. Create a PR referencing the issue

## Notes

- Follow existing code style
- Add tests if appropriate
- PR description should include issue summary and fix details
- Include `Closes #$ARGUMENTS` in PR description
