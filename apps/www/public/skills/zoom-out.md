---
title: Zoom Out
tags: [skill, codebase]
created: 2026-05-14
updated: 2026-05-14
summary: Asks for a higher-level map of modules, callers, and domain vocabulary before diving into unfamiliar code.
aliases: [big-picture-map]
---

# Zoom Out

Use when a file or subsystem is unfamiliar and local reading isn’t giving **context**. You want the layer above: how pieces connect, who calls what, and the names the project uses for those concepts.

## When to use

- Jumping into a foreign area mid-task.
- Line-by-line reading doesn’t explain *why* the structure exists.
- You need the mental model before suggesting changes.

## When to skip

- The question is already localized (one function, one bug, one obvious fix).
- You already have an architecture doc you trust — read that instead of asking for a re-map.

## What to ask for

- **Map** — modules or packages involved, main data/control flow, entry points.
- **Callers** — who invokes this path; what contracts or events cross the edge.
- **Vocabulary** — use the project’s domain terms (from glossaries or ubiquitous language), not generic labels like “service layer” unless the code actually names them that way.

Prefer pointers to real files and symbols over abstract boxes unless a diagram already exists.

## Output should feel like

- You could draw the graph from the answer.
- Names match how maintainers talk and how a domain glossary (or similar) labels concepts.

## Related

- [[improve-codebase-architecture]] — turns “this feels tangled” into deepening candidates.
- [[skills-index]] — vault catalog.
