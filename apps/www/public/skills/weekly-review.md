---
title: Weekly Review
tags: [skill, git, process]
created: 2026-05-10
updated: 2026-05-10
summary: Synthesize shipped commits from the past 7–10 days into a short categorized summary with highlights by bug fix, tech debt, and new functionality.
aliases: [week-in-review, commit-review]
---

# Weekly Review

Pull the last 7–10 days of commits authored by you, synthesize what shipped, and categorize the work — without reading every diff manually.

## When to use

- End-of-week personal review or standup prep.
- Writing a sprint summary.
- Auditing what actually landed versus what was planned.

## How to apply

1. Get your git `user.email` (`git config user.email`). If unset, ask the user to set it.
2. Pull all commits on the main branch from the past 7–10 days authored by that email.
3. Write 2–5 bullets summarizing the changes in plain language.
4. Add a short closing paragraph tagging work as: **tech debt**, **bug fix**, or **net-new functionality**.

## Output should feel like

- 2–5 bullets, each one sentence.
- A closing paragraph that honestly categorizes the week's output — not promotional.
- No PR numbers, branch names, or technical tool references.

## Related

- [[git-conventions]] — commit format context for reading the log.
- [[skills-index]] — vault catalog.
