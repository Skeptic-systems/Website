# Commit Staged Changes

Generate a conventional commit message and commit staged changes, respecting the project's commitlint configuration.

## Instructions

### 1. Stage All Changes (always)

Stage all changes before generating a message or committing:

```bash
git add -A
```

### 2. Gather Context

Run the single git command from [100-git-conventions](mdc:.cursor/rules/100-git-conventions.mdc) to gather all context (PowerShell-safe separators):

```bash
echo "=== BRANCH ==="; git rev-parse --abbrev-ref HEAD; echo "=== STAGED FILES ==="; git diff --staged --stat; echo "=== STAGED CHANGES ==="; git diff --staged
```

If there are no changes after staging, inform the user and stop.

### 3. Analyze & Generate

From the gathered information:

- Extract the GitHub issue number if available from branch name or changes
- Identify affected packages/apps from file paths → determine scope
- Analyze the nature of changes → determine commit type
- Generate commit message following the format in [100-git-conventions](mdc:.cursor/rules/100-git-conventions.mdc)

### 4. Present & Execute Commit

Show the generated commit message in a code block:

```text
type(scope): description

Optional body text

Closes #123
```

Explain the ticket number, type, and scope chosen.

Then **execute the commit** with `--no-verify` (skip lefthook) using a single -m and explicit `n line breaks (PowerShell-safe):

```bash
git commit --no-verify -m "type(scope): description`n- Bullet 1`n- Bullet 2`nCloses #GITHUB_ISSUE"
```

Notes:
- Do not use multiple -m flags.
- Avoid empty blank lines; use `n to control exact line breaks.
- If no body is needed, use only the subject (still with `--no-verify`):

```bash
git commit --no-verify -m "type(scope): description"
```

After committing, show the commit hash and confirm success.

### 5. Select Push Target & Push (numeric choice required)

After a successful commit, detect the current branch and propose where to push. Present the user with:

1. current branch (`<current-branch>`) – push to the branch you are on
2. suggested project branch (`<suggested-branch>`) – based on commit type/subject
3. create new branch (`<suggested-branch>`) – create and push a new branch

Prompt the user exactly like this and wait for input:

```
Choose where to push:
1) current branch (<current-branch>)
2) suggested branch (<suggested-branch>)
3) create new branch (<suggested-branch>)

Enter 1, 2, or 3:
```

Only proceed after receiving a valid numeric choice (1/2/3). Do not push by default.

Rules for `<suggested-branch>` (kebab-case, derived from commit):

- `feat` → `feature/<short-subject>`
- `fix` → `bugfix/<short-subject>`
- `refactor` → `refactor/<short-subject>`
- `docs` → `docs/<short-subject>`
- `chore` → `chore/<short-subject>`
- `perf` → `perf/<short-subject>`
- `test` → `test/<short-subject>`
- `build` → `build/<short-subject>`
- `ci` → `ci/<short-subject>`

Where `<short-subject>` is the commit subject normalized to kebab-case (omit scope, keep it concise).

Show the current and suggested branch names explicitly, then ask the user to choose 1/2/3. Execute accordingly:

- Choice 1 (current):

```bash
git push -u origin <current-branch>
```

- Choice 2 (suggested existing or new):

```bash
# switch or create, then push
git switch <suggested-branch> 2>/dev/null || git switch -c <suggested-branch>
git push -u origin <suggested-branch>
```

- Choice 3 (force create new suggested):

```bash
git switch -c <suggested-branch>
git push -u origin <suggested-branch>
```

After pushing, show the branch and the short commit hash.

### 6. Error Handling

All commits are executed with `--no-verify`, skipping lefthook hooks by default.

If the commit still fails (e.g., due to repository state, merge conflicts, or Git errors):

- Show the exact error output.
- Propose minimal, focused fixes (e.g., resolve conflicts, stage files) and retry.

## Key Points

- Follow the conventional commits format: `<type>(<scope>): <subject>`
- Use imperative, present tense for subject and body
- Body is optional unless adding context or breaking changes
- Footer with `Closes #123` is optional but recommended for feat/fix commits
- See [100-git-conventions](mdc:.cursor/rules/100-git-conventions.mdc) for complete format rules

## Example Usage

**User:** "commit", "commit staged changes", or `/commit`

**Response:**

1. Run single git command to gather context
2. Extract ticket number, analyze changes, determine type and scope
3. Generate properly formatted commit message
4. Show the message in a code block
5. Execute the git commit command
6. Display branch choices (current, suggested, create new) and wait for 1/2/3
7. Push to the selected branch and confirm with commit hash and remote branch