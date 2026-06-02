---
title: Fix Merge Conflicts
tags: [skill, git, process]
created: 2026-05-10
updated: 2026-05-10
summary: Resolve merge conflicts non-interactively with correctness-first edits, validate the build, and summarize resolution decisions.
aliases: [merge-conflicts, resolve-conflicts]
---

# Fix Merge Conflicts

A branch has unresolved conflicts. Resolve them without hand-editing lockfiles, without leaving markers, and without broad refactors — then confirm the build is clean.

## When to use

- `git status` shows conflicting files after a merge or rebase.
- A PR can't be merged due to conflicts.

## How to apply

1. Detect all conflicting files from `git status` and conflict markers.
2. Resolve each conflict with minimal, correctness-first edits. Preserve both sides when safe; otherwise choose the variant that compiles and keeps public behavior stable.
3. Regenerate lockfiles using the package manager (`npm install`, `pnpm install`, etc.) — never hand-edit them.
4. Run compile, lint, and relevant tests.
5. Stage resolved files and summarize the key resolution decisions.

**Never** leave conflict markers in any file. **Never** push or create tags during conflict resolution. **Never** refactor while resolving — that's a separate commit.

## Output should feel like

- A list of resolved files.
- Brief notes on non-obvious resolution choices.
- Build and test outcome confirmed.

## Related

- [[fix-ci]] — the CI failures that often follow a conflict resolution.
- [[git-conventions]] — commit format for the resolution commit.
- [[skills-index]] — vault catalog.
