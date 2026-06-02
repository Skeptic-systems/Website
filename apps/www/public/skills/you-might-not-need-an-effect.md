---
title: You Might Not Need an Effect
tags: [skill, react, frontend]
created: 2026-05-10
updated: 2026-05-10
summary: Audit React code for useEffect anti-patterns per react.dev guidelines and optionally apply fixes in place.
aliases: [no-effect, useeffect-audit, effect-antipatterns]
---

# You Might Not Need an Effect

`useEffect` is the most commonly misused React hook. Most effects exist to synchronize state that could simply be derived, or to handle events that should be handled in event handlers. This skill audits code against the [react.dev guidelines](https://react.dev/learn/you-might-not-need-an-effect) and fixes the patterns it finds.

## When to use

- Reviewing a component that has multiple `useEffect` calls.
- A bug traces back to effect timing or stale closure.
- Code review for any file with `useEffect`.

## How to apply

1. Read [https://react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect) to load the current guidelines.
2. Identify the scope: current diff, a PR, a specific folder, or the whole codebase.
3. Scan for anti-patterns: derived state computed in an effect, event-driven logic in an effect, data fetching without a library, effects that reset state on prop change, and chains of effects that sync to each other.
4. By default, apply fixes directly. Pass `fix=false` to only propose without changing files.

## Output should feel like

- Fewer `useEffect` calls, each with a single clear synchronization purpose.
- Derived values computed inline or with `useMemo`, not synced via state.
- Event handlers handling events; effects handling external system sync.

## Related

- [[split-react-components]] — companion cleanup for component file structure.
- [[frontend-design]] — broader React code quality.
- [[skills-index]] — vault catalog.
