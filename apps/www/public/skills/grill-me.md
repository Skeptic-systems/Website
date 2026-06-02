---
title: Grill Me
tags: [skill, process, ai]
created: 2026-05-10
updated: 2026-05-10
summary: Relentlessly interview a plan or design, one question at a time, until every branch of the decision tree is resolved.
aliases: [stress-test-plan, plan-interview]
---

# Grill Me

Surface the gaps in a plan by interrogating it exhaustively before any code is written. The agent walks down each branch of the decision tree, resolving dependencies between decisions one by one, and provides its own recommended answer for each question.

The failure mode this prevents: discovering a fundamental design conflict after implementation has started.

## When to use

- User wants to stress-test a plan or design before committing to it.
- User says "grill me" or "challenge this plan".
- A decision has many interdependent branches that need resolving.

## When to skip

- The decision is already made and the user wants implementation, not interrogation.
- The codebase can answer the question directly — explore it instead of asking.

## How to apply

- Ask questions one at a time. Don't front-load all questions at once.
- For each question, provide your recommended answer based on what you know.
- If a question can be answered by reading the codebase, read it rather than asking.
- Keep going until every branch is resolved and no open decisions remain.

## Output should feel like

- A resolved decision tree, not a list of open questions.
- The user left with confidence in the plan, or with a fundamentally revised one.

## Related

- [[request-refactor-plan]] — turns the resolved plan into a GitHub issue.
- [[skills-index]] — vault catalog.
