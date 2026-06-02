---
title: Improve Codebase Architecture
tags: [skill, architecture]
created: 2026-05-14
updated: 2026-05-14
summary: Surfaces deepening opportunities so shallow modules become deep, testable seams anchored in domain language and recorded decisions.
aliases: [architecture-deepening, codebase-architecture]
---

# Improve Codebase Architecture

Find **deepening** opportunities: refactors where a smaller interface hides more behaviour — better **leverage** for callers, better **locality** for maintainers and tests. Ground suggestions in the project’s domain words (e.g. a `CONTEXT` glossary) and **don’t re-litigate** ADRs unless friction clearly warrants reopening them.

Use this vocabulary consistently — avoid drifting to “component,” “service,” “API,” or “boundary” as synonyms:

- **Module** — anything with an interface and implementation (any scale).
- **Interface** — everything a caller must know: types, invariants, errors, ordering, config — not “the public methods” alone.
- **Implementation** — code inside the module.
- **Depth** — lots of behaviour behind a small interface (**deep** vs **shallow**).
- **Seam** — where the interface sits; behaviour can change without editing call sites in place.
- **Adapter** — concrete implementation of an interface at a seam.
- **Leverage** / **locality** — caller benefit vs maintainer/debug benefit from depth.

**Principles:** **Deletion test** — delete the module; if complexity scatters to N callers, it earned its keep; if it vanishes, it was a pass-through. **Interface = test surface.** **One adapter = hypothetical seam; two adapters = real seam.**

## When to use

- Refactors, consolidation, or “this is hard to test / hard to explain.”
- You want AI- and human-navigable structure, not another layer of indirection.

## When to skip

- Cosmetic moves with no change in seams or testability.
- A decision is already encoded in an ADR you’re not prepared to challenge.

## The loop

1. **Explore** — read domain context and ADRs for the area. Walk code and note friction: shallow modules, leaked seams, tests coupled to internals, concepts split across many tiny files.
2. **Candidates** — numbered list; each with **files**, **problem**, **solution** (plain English), **benefits** (locality, leverage, testing). Use domain names from context, not internal codenames. Flag ADR conflict only when reopening is plausible. **Do not** sketch new interfaces yet — stop at “which candidate next?”
3. **Grill** — on the chosen candidate, walk constraints and shape. If you name a concept not in the glossary, add it there. If the user rejects for a durable reason, offer recording an ADR so future reviews don’t repeat the same pitch.

**Dependencies (when deepening):** in-process and locally substitutable deps are easiest to fold behind one interface; remote-owned systems want a port + adapters; true externals get injected ports and test doubles. **Replace shallow tests** with tests through the deep module’s interface — delete tests that only guarded the old split.

## Output should feel like

- Honest about trade-offs and ADRs.
- Uses one vocabulary for architecture and another for the product domain.

## Related

- [[grill-me]] — stress-test a single candidate before committing.
- [[request-refactor-plan]] — turn agreement into staged commits and an issue.
- [[zoom-out]] — get the map before you deepen a cluster.
- [[skills-index]] — vault catalog.
