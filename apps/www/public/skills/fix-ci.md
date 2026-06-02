---
title: Fix CI
tags: [skill, git, process]
created: 2026-05-10
updated: 2026-05-10
summary: Find the first actionable failure in a PR's CI checks, apply the smallest safe fix, and loop until all checks are green.
aliases: [ci-fix, fix-failing-checks]
---

# Fix CI

A PR's CI is red. Don't guess — read the checks, find the first actionable error, fix it, push, and repeat.

## When to use

- A branch or PR has failing CI checks.
- CI output is ambiguous and needs systematic triage.

## How to apply

1. Run `gh pr checks --json name,bucket,state,workflow,link` to get the full check set.
2. Find the first failed job. Use GitHub Actions logs when available; otherwise follow the check link to identify the failing command.
3. Extract the first actionable error — one thing, not everything.
4. Apply the smallest safe fix.
5. Push, re-run `gh pr checks`, repeat until green.

**Fix one failure at a time.** Prefer minimal, low-risk changes before broader refactors. `gh pr checks` is the source of truth — don't assume a fix worked until it shows green there.

## Output should feel like

- Primary failing job and root error stated up front.
- Fixes listed in the order they were applied.
- Final CI status confirmed from `gh pr checks`.

## Related

- [[fix-merge-conflicts]] — resolve the conflicts that often precede CI failures.
- [[git-conventions]] — commit format for the fix commits.
- [[skills-index]] — vault catalog.
