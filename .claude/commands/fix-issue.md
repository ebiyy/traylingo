---
description: Fix a GitHub Issue - create worktree, implement fix, and open PR
---

Fix GitHub Issue #$ARGUMENTS using git worktree for isolation.

## Steps

1. Run `gh issue view $ARGUMENTS` to understand the issue
2. Create a worktree with a new branch:
   ```bash
   git worktree add ../traylingo-issue-$ARGUMENTS -b fix/issue-$ARGUMENTS
   ```
3. Tell the user to switch directory and restart Claude Code:
   ```bash
   cd ../traylingo-issue-$ARGUMENTS
   ```

## After user switches to worktree directory

4. Implement the fix (add tests if needed)
5. Run checks based on changed files:
   - TypeScript/Frontend: `pnpm lint` `pnpm typecheck`
   - Rust/Backend: `cargo fmt --check` `cargo clippy`
6. Commit using conventional commits format
7. Create a PR referencing the issue
8. Tell user to clean up after PR merge:
   ```bash
   cd ../traylingo && git worktree remove ../traylingo-issue-$ARGUMENTS
   ```

## Notes

- Follow existing code style
- Add tests if appropriate
- Include `Closes #$ARGUMENTS` in PR description
- Worktree isolates work from other branches
