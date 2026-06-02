---
title: Request Refactor Plan
tags: [skill, process, git]
created: 2026-05-10
updated: 2026-05-10
summary: Interview the user about a refactor, explore the codebase, break the work into tiny commits, and file the plan as a GitHub issue.
aliases: [refactor-rfc, refactor-plan]
---

# Request Refactor Plan

Turn a vague refactor intention into a concrete, safe plan filed as a GitHub issue. The interview forces scope clarity before a line of code changes. The output is a plan of commits small enough that the codebase is always in a working state.

> "Make each refactoring step as small as possible, so that you can always see the program working." — Martin Fowler

## When to use

- User wants to plan a refactor before starting.
- A refactor spans multiple files or modules and needs coordination.
- The user wants a paper trail and shared understanding before execution.

## How to apply

1. Ask for a detailed description of the problem and any initial solution ideas.
2. Explore the repo — verify the user's assertions, understand the current shape of the code.
3. Surface alternative approaches; ask whether they've been considered.
4. Interview the user about the implementation in depth — scope, modules, interfaces, test coverage.
5. Hammer out what is in and out of scope.
6. Check test coverage for the affected area; surface gaps.
7. Break the work into a plan of **tiny commits** — each leaves the codebase working.
8. File a GitHub issue using the refactor plan template (Problem Statement, Solution, Commits, Decision Document, Testing Decisions, Out of Scope).

## Output should feel like

- A GitHub issue the team can hand to any developer and have them start immediately.
- No ambiguous steps, no "we'll figure it out" commits.

## Related

- [[grill-me]] — for stress-testing the plan before filing it.
- [[git-conventions]] — commit format the plan's commits should follow.
- [[skills-index]] — vault catalog.
