---
description: Create a release branch and prepare for deployment
---

Create release v$ARGUMENTS for TrayLingo.

## Variables

- `VERSION`: $ARGUMENTS
- `BRANCH_NAME`: release/v$ARGUMENTS
- `BASE_BRANCH`: develop

## Pre-flight Checks

1. Verify develop is clean and up-to-date:
   ```bash
   git checkout develop
   git pull origin develop
   git status  # Should be clean
   ```

2. Ensure CI passes on develop (check GitHub Actions)

3. Review CHANGELOG.md `[Unreleased]` section has content

## Create Release Branch

4. Create and checkout release branch:
   ```bash
   git checkout -b release/v$ARGUMENTS
   ```

## Version Bump

5. Update version in all 3 files to `$ARGUMENTS`:
   - `package.json` (line 3: `"version": "$ARGUMENTS"`)
   - `src-tauri/Cargo.toml` (line 3: `version = "$ARGUMENTS"`)
   - `src-tauri/tauri.conf.json` (line 4: `"version": "$ARGUMENTS"`)

6. Verify versions match:
   ```bash
   node -p "require('./package.json').version"
   grep -m1 '^version' src-tauri/Cargo.toml | cut -d'"' -f2
   node -p "require('./src-tauri/tauri.conf.json').version"
   ```

## Update CHANGELOG

7. In CHANGELOG.md:
   - Change `## [Unreleased]` to `## [$ARGUMENTS] - YYYY-MM-DD` (use today's date)
   - Add new `## [Unreleased]` section at top (after header)
   - Update comparison links at bottom:
     ```
     [Unreleased]: https://github.com/ebiyy/traylingo/compare/v$ARGUMENTS...HEAD
     [$ARGUMENTS]: https://github.com/ebiyy/traylingo/releases/tag/v$ARGUMENTS
     ```

## Commit and Push

8. Commit release preparation:
   ```bash
   git add -A
   git commit -m "chore: prepare release v$ARGUMENTS"
   git push -u origin release/v$ARGUMENTS
   ```

## Create PR

9. Create PR to main:
   ```bash
   gh pr create --base main --head release/v$ARGUMENTS \
     --title "Release v$ARGUMENTS" \
     --body "$(cat <<'EOF'
   ## Release v$ARGUMENTS

   ### Changes
   See [CHANGELOG.md](./CHANGELOG.md) for details.

   ### Checklist
   - [ ] All CI checks pass
   - [ ] Version numbers match in all 3 files
   - [ ] CHANGELOG updated with release date
   - [ ] Manual QA completed (pnpm tauri dev)

   ### Post-merge Steps
   After merging this PR:
   1. `git checkout main && git pull`
   2. `git tag v$ARGUMENTS && git push origin v$ARGUMENTS`
   3. Monitor GitHub Actions for release build
   4. Edit draft release on GitHub if needed
   5. Merge release branch back to develop
   6. Delete release branch
   EOF
   )"
   ```

## Post-Merge Instructions (Manual)

After PR is merged to main:

10. Tag the release:
    ```bash
    git checkout main
    git pull origin main
    git tag v$ARGUMENTS
    git push origin v$ARGUMENTS
    ```

11. Merge back to develop:
    ```bash
    git checkout develop
    git pull origin develop
    git merge main
    git push origin develop
    ```

12. Clean up:
    ```bash
    git branch -d release/v$ARGUMENTS
    git push origin --delete release/v$ARGUMENTS
    ```

## Notes

- **Version format**: Use semantic versioning (MAJOR.MINOR.PATCH)
- **All 3 version files must match**: package.json, Cargo.toml, tauri.conf.json
- **Tag triggers release.yml**: Builds .dmg and creates draft GitHub release
- **Squash merge recommended**: Keep main history clean
