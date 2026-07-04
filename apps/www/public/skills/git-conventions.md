---
title: Git Conventions
tags: [skill, git, process]
created: 2026-05-10
updated: 2026-05-10
summary: Conventional commit format and branch naming rules used as a reference when writing commit messages or advising on version control practices.
aliases: [conventional-commits, commit-format, branch-naming]
---

# Git Conventions

A reference for commit message format and branch naming. Load this when generating commit messages, naming branches, or reviewing version control practices.

## Commit format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types** — `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

**Scope** — infer from file paths: package/app name in monorepos, subsystem in single-package repos, `repo` for repo-wide, `deps` for dependency updates. Omit if truly cross-cutting.

**Subject rules** — imperative present tense (`add`, not `added`), no capital, no trailing period, ≤ 72 chars.

**Body** — explains *why*, not *what*. Wrap at 72 chars. Blank line between subject and body.

**Footer** — `Closes #123` for feat/fix. `BREAKING CHANGE: <desc>` or `feat(api)!: …` shorthand for breaking changes.

## Branch naming

```
<type>/<optional-issue>-<kebab-description>
```

Prefixes: `feature/`, `bugfix/`, `hotfix/`, `refactor/`, `chore/`, `docs/`. Always lowercase kebab-case. Include issue number when available.

## Current-branch rule

When committing on the user's behalf, use the checked-out branch as-is. Do not create or switch branches just because `main` is current — only do so if explicitly asked.

## Gather context before writing

```bash
echo "=== BRANCH ===" && git rev-parse --abbrev-ref HEAD && \
echo "=== STAGED FILES ===" && git diff --staged --stat && \
echo "=== STAGED CHANGES ===" && git diff --staged
```

## Related

- [[fix-ci]] — fix failing CI checks after a bad commit lands.
- [[skills-index]] — vault catalog.
