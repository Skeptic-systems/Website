# Cleanup Unused Code and Assets

Create a safe, scoped cleanup for unused/transient files without removing existing features or UI. Supports repository-wide or app-specific scopes.

## Usage

- `/cleanup` → analyze whole repo and propose deletions
- `/cleanup www` → analyze only `apps/www`
- `/cleanup api` → analyze only `apps/api`
- `/cleanup applied` or `/cleanup www applied` → execute after preview approval

## Instructions

### 1) Determine Scope

If a scope argument is provided, map it to a path:
- `www` → `apps/www`
- `api` → `apps/api`
- no argument → repo root

Validate the path exists; if not, stop with an actionable error.

### 2) Analyze and Propose

Within scope, gather a proposed cleanup list. Do NOT delete anything yet.

- Detect unused translations: keys present in `apps/www/src/locals/*.json` but not referenced via `useTranslations`, `getTranslations`, or `t("...")`
- Detect unused CSS utilities/variables in `globals.css` and Tailwind classes not referenced in `content`
- Detect orphaned components/assets not imported anywhere
- Detect dead code files (no exports referenced), story/demo files, and commented-out code blocks

Show a preview list grouped by type with file paths. Example groups:
- Translations → keys to remove
- CSS → selectors/vars to remove
- Files → to delete

If the list is empty, report "Nothing to clean" and stop.

### 3) Create Safety Snapshot

Before any destructive changes:

- Create a safety branch from current HEAD:

```bash
git rev-parse --abbrev-ref HEAD
git switch -c safety/cleanup-<timestamp>
```

- Tag the previous branch tip for easy return:

```bash
git tag safety-cleanup-<timestamp>
```

Return to the original working branch:

```bash
git switch -
```

### 4) Apply Cleanup (only for `/cleanup ... applied`)

Proceed only when the user explicitly includes `applied`.

- Remove unused translation keys in-place (preserve file structure and both `en` and `de` symmetry)
- Prune CSS variables/utilities not referenced
- Delete orphaned files
- Keep changes minimal and focused; do not alter feature code paths

Stage changes and show a concise diff summary:

```bash
git add -A
git --no-pager diff --staged --stat
```

### 5) Commit (skip hooks)

Use conventional commits format with scope inferred from path:

```bash
git commit --no-verify -m "chore(<scope>): cleanup unused files and translations`n- Remove dead assets and keys`n- Keep features and UI unchanged`n- Safety branch: safety/cleanup-<timestamp>"
```

### 6) Safeguards

- Never remove code reachable from public routes, exported components, or referenced by i18n keys
- If uncertainty exists, keep the file and note it in the preview
- Always create the safety branch and tag before changes

### 7) Rollback

To undo, run `/back`. It restores to the most recent safety snapshot created by this command.









