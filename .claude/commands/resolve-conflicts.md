---
description: Resolve PR conflicts with careful commit analysis
---

Resolve conflicts in PR #$ARGUMENTS with careful analysis of both branches.

## Variables

- `PR_NUM`: $ARGUMENTS

## Steps

### 1. Gather PR Information

```bash
# Get PR details (base/head branches, mergeable status)
gh pr view $ARGUMENTS --json title,headRefName,baseRefName,state,mergeable

# Fetch latest from origin
git fetch origin
```

### 2. Analyze Branch Differences

```bash
# Compare commits between branches (< = base only, > = head only)
git log --oneline origin/<base>...origin/<head> --left-right

# Check recent commits on each branch
git log --oneline origin/<base> -10
git log --oneline origin/<head> -10
```

### 3. Checkout Head Branch and Start Merge

```bash
git checkout <head>
git pull origin <head>
git merge origin/<base> --no-commit --no-ff
```

### 4. Identify Conflicted Files

```bash
# List conflicted files
git diff --name-only --diff-filter=U
```

### 5. Analyze Each Conflict (CRITICAL)

For each conflicted file:

1. **Read the file** to see conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. **Check commit history** for that file on both branches:
   ```bash
   git log --oneline origin/<base> -10 --follow -- <file>
   git log --oneline origin/<head> -10 --follow -- <file>
   ```
3. **Review specific commits** that touched the file:
   ```bash
   git show <commit> --stat -- <file>
   ```
4. **Understand intent** of each side's changes before resolving

### 6. Resolve Conflicts

- **Keep both**: When changes are additive and non-overlapping
- **Keep one side**: When one branch has more recent/complete changes
- **Merge manually**: When both sides have important changes to combine
- **Remove duplicates**: Watch for duplicate sections after merge

### 7. Verify Resolution

```bash
# Check no conflict markers remain
grep -n "<<<<<<\|======\|>>>>>>" <file> || echo "No conflict markers"

# Verify git status shows resolved
git diff --name-only --diff-filter=U
```

### 8. Complete Merge

```bash
git add <resolved-files>
git commit -m "$(cat <<'EOF'
Merge branch '<base>' into <head>

Resolve conflicts in <files>:
- <description of resolution for each file>
EOF
)"
git push origin <head>
```

### 9. Verify PR Status

```bash
gh pr view $ARGUMENTS --json mergeable,state
```

## Resolution Principles

1. **Never resolve blindly** - Always understand what each side intended
2. **Check commit messages** - They explain why changes were made
3. **Preserve newer work** - More recent commits usually have more context
4. **Watch for duplicates** - Merge conflicts can create duplicate sections
5. **Test after resolution** - Run lint/typecheck if applicable

## Common Patterns

| Scenario | Resolution |
|----------|------------|
| Both added to same section | Keep both additions |
| Both modified same line | Check which is more recent/complete |
| One deleted, one modified | Usually keep the modification |
| Structural reorganization | Follow the more organized structure |

## Self-Improvement (IMPORTANT)

After completing conflict resolution, evaluate and improve this command:

### 10. Post-Resolution Review

Ask yourself:
1. **Was the resolution correct?** - Did the merge preserve all intended changes?
2. **Were there unexpected issues?** - Duplicate sections, lost changes, wrong decisions?
3. **Did I discover a new pattern?** - A scenario not covered in Common Patterns?
4. **Could the process be improved?** - Missing steps, unclear instructions?

### 11. Update This Command If Needed

If any of the above apply:

1. **New pattern discovered** → Add to Common Patterns table
2. **Process improvement** → Update the relevant Steps section
3. **Edge case encountered** → Add to Resolution Principles or create new section
4. **Mistake made** → Document what went wrong and how to avoid it

```bash
# Edit this command file
# .claude/commands/resolve-conflicts.md
```

Then commit the improvement:
```bash
git add .claude/commands/resolve-conflicts.md
git commit -m "docs: improve /resolve-conflicts based on PR #$ARGUMENTS resolution"
```

### Why Self-Improvement Matters

- Each conflict resolution is unique - rigid rules don't always apply
- "Correct" resolution depends on context, project state, and intent
- This command should evolve with the project's needs
- Learned patterns benefit future conflict resolutions
