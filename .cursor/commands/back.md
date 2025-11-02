# Back (Undo to Last Safety Snapshot)

Restore the workspace to the latest safety snapshot created by `/cleanup` (or other maintenance actions that created `safety/*` markers).

## Usage

- `/back` → revert to most recent safety snapshot

## Instructions

### 1) Detect Most Recent Safety Snapshot

- Prefer the newest tag named `safety-cleanup-<timestamp>`
- If no tag exists, look for the latest branch matching `safety/cleanup-*`
- If neither exists, stop and report that no snapshot was found

### 2) Stash Uncommitted Changes (if any)

```bash
git stash push -u -m "pre-back-<timestamp>"
```

### 3) Reset to Snapshot

- If a tag exists:

```bash
git reset --hard refs/tags/<latest-safety-tag>
```

- Else, if a safety branch exists:

```bash
git reset --hard refs/heads/<latest-safety-branch>
```

### 4) Post-Reset Verification

- Show concise status and last 1 commit to confirm:

```bash
git --no-pager log -1 --oneline
 git status --porcelain
```

### 5) Restore Optional Stash

- If the stash was created in step 2 and the user requests it, re-apply:

```bash
git stash pop
```

### Safeguards

- Never force-push as part of this command
- Operate only locally; do not change remotes
- If reset would discard untracked work and no stash is created, stop with a clear message


