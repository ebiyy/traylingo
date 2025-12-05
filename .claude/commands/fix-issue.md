---
description: Fix a GitHub Issue - create worktree, implement fix, and open PR
---

Fix GitHub Issue #$ARGUMENTS using git worktree for isolation.

## Variables

- `ISSUE_NUM`: $ARGUMENTS
- `WORKTREE_PATH`: ../traylingo-issue-$ARGUMENTS
- `BRANCH_NAME`: fix/issue-$ARGUMENTS
- `BASE_BRANCH`: develop

## Steps

1. Run `gh issue view $ARGUMENTS` to understand the issue
2. Ensure develop is up-to-date and create a worktree:
   ```bash
   git fetch origin develop
   git worktree add ../traylingo-issue-$ARGUMENTS -b fix/issue-$ARGUMENTS origin/develop
   ```
3. **Continue working automatically** - NO directory switch needed

## Implementation (work in worktree from current directory)

4. Edit files using the worktree path: `../traylingo-issue-$ARGUMENTS/src/...`
5. Run checks in worktree:
   ```bash
   # TypeScript/Frontend
   (cd ../traylingo-issue-$ARGUMENTS && pnpm lint && pnpm typecheck)
   # Rust/Backend
   cargo fmt --check --manifest-path ../traylingo-issue-$ARGUMENTS/src-tauri/Cargo.toml
   cargo clippy --manifest-path ../traylingo-issue-$ARGUMENTS/src-tauri/Cargo.toml
   ```
6. Commit and push using git -C:
   ```bash
   git -C ../traylingo-issue-$ARGUMENTS add .
   git -C ../traylingo-issue-$ARGUMENTS commit -m "fix: description"
   git -C ../traylingo-issue-$ARGUMENTS push -u origin fix/issue-$ARGUMENTS
   ```
7. Create PR targeting develop:
   ```bash
   gh pr create --repo ebiyy/traylingo --base develop --head fix/issue-$ARGUMENTS --title "Fix #$ARGUMENTS: title" --body "Closes #$ARGUMENTS"
   ```
8. After PR merge, clean up:
   ```bash
   git worktree remove ../traylingo-issue-$ARGUMENTS
   git branch -d fix/issue-$ARGUMENTS
   ```

## Notes

- **Always branch from `develop`** (not main) - main is protected
- PRs must target `develop` branch
- Follow existing code style
- Add tests if appropriate
- Include `Closes #$ARGUMENTS` in PR description
- All operations use paths/flags to work in worktree without cd
