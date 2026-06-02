---
title: Handoff
tags: [skill, process]
created: 2026-05-14
updated: 2026-05-14
summary: Compresses a working session into a document another agent can use to resume without re-reading the whole chat.
aliases: [session-handoff, agent-handoff]
---

# Handoff

Turn the current conversation into a **handoff**: enough context and next steps that a fresh session can continue cold. Use when you are pausing work, swapping agents, or handing a thread to someone else.

Skip duplicating what already exists in artifacts — point to paths or URLs for PRDs, plans, ADRs, issues, commits, and diffs. If the reader has a stated focus for the next session, shape the doc around that.

## When to use

- Ending a long session and starting fresh elsewhere.
- Another person or agent needs continuity without transcript archaeology.
- You want a single “start here” for the next turn.

## When to skip

- Nothing is decided yet and the only honest handoff is “keep exploring.” Say that in one line instead of a faux-document.

## How to write it

1. **State** — what you were doing, what’s done, what’s blocked.
2. **Pointers** — files, branches, tickets, docs; no paste of full specs.
3. **Next** — concrete next actions in order, with any constraints called out.
4. **Skills** — name any operating manuals or checks the next session should load (if applicable).

Keep it short. Prefer bullets over narrative.

## Output should feel like

- A teammate could run with it in one read.
- Zero “as we discussed above” — links replace replay.

## Related

- [[request-refactor-plan]] — when the handoff is mostly “here’s the refactor plan issue.”
- [[skills-index]] — vault catalog.
