---
title: Iterate Browser
tags: [skill, process, frontend]
created: 2026-05-10
updated: 2026-05-10
summary: Debug frontend issues autonomously using browser tools and debug traces until the fix is verified — without asking the user to test manually.
aliases: [browser-debug, debug-loop]
---

# Iterate Browser

Reproduce and fix a frontend issue using browser tooling and instrumentation, without handing off to the user at any point. The loop runs until the fix is verified in the browser.

The failure mode this prevents: ending a debugging session with "try it and let me know" — which is a handoff, not a resolution.

## When to use

- A frontend bug needs investigation and the browser is the source of truth.
- The issue is hard to reproduce from code alone — it needs live interaction.

## How to apply

1. Add `debug.log` traces at key locations in the code.
2. Use browser tools (`browser_navigate`, `browser_click`, `browser_snapshot`, etc.) to reproduce the issue and collect trace output.
3. Analyze the traces, identify the root cause, and apply a fix.
4. Repeat until the issue is verified resolved — in the browser, not by assumption.

Never ask the user to "try it out" or "let me know if it works."

## Output should feel like

- A confirmed fix, evidenced by browser tool output showing the correct state.
- Traces removed or scoped behind a debug flag after the fix lands.

## Related

- [[skills-index]] — vault catalog.
