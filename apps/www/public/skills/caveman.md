---
title: Caveman
tags: [skill, communication]
created: 2026-05-14
updated: 2026-05-14
summary: Ultra-terse replies that drop filler while keeping full technical correctness.
aliases: [caveman-mode, less-tokens]
---

# Caveman

**Caveman** is a communication mode: maximum density, minimum ceremony. Trigger when you or the user want “less tokens,” “be brief,” or `/caveman`. Stays on until **stop caveman** or **normal mode**.

## When to use

- Long threads where speed and clarity beat polish.
- You want diagnosis + fix without essay framing.
- Tokens or latency actually matter.

## When to skip

- Legal, safety, or irreversible actions need full sentences and explicit confirmation.
- The user asks for teaching, tone, or narrative on purpose.

## Rules

- **Drop** articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, soft hedging. Fragments OK.
- **Keep** exact technical terms, code, errors (quote verbatim).
- **Prefer** short words, abbreviations readers already know (DB, auth, config, req/res, fn, impl).
- **Shape:** `[thing] [action] [reason]. [next step].` Use `->` for causality when it helps.

## Auto-clarity exception

Break caveman for: security warnings, destructive confirmations, multi-step ops where order matters, or when the user asks you to clarify. Snap back after that slice is done.

## Output should feel like

- Punchy, scannable, zero throat-clearing.
- Still precise — never shorthand that changes meaning.

## Related

- [[humanizer]] — opposite trade: polish prose for readers, not compression for operators.
- [[skills-index]] — vault catalog.
