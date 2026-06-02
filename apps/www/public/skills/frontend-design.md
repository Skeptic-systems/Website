---
title: Frontend Design
tags: [skill, design, frontend]
created: 2026-05-10
updated: 2026-05-10
summary: Build distinctive, production-grade frontends instead of generic AI UI.
aliases: [ui-design, design-eng]
---

# Frontend Design

A working manual for producing frontend code that looks like a designer touched it. Use when generating a new component, page, landing site, dashboard or polishing existing UI.

The default failure mode of LLM frontend output is "purple-blue gradient, rounded-2xl card, three columns, shadcn defaults, Inter everywhere". Avoid by making concrete design decisions before writing the markup.

## When to use

- Building any user-facing surface from scratch.
- Refactoring a screen that "works" but feels generic.
- Reviewing AI-generated UI before merging.

## Decide before you code

1. **A reference.** Pick one site or product whose feel you want to channel. Note 3 specific things you'd steal: a typographic choice, a layout pattern, a motion detail.
2. **A palette.** 1 background, 1 foreground, 1 muted, 1 accent. Write down the hex values. No "neutral-500".
3. **A type pair.** One display, one body. Specify weights. If unsure, mono for body lands more often than another sans.
4. **A grid.** Pick the max width, the column count, the gap. Stick to it.
5. **A density.** Comfortable, compact, or spacious. Pick one and apply it consistently.

## While you build

- **Borders before shadows.** A 1px hairline at low opacity (`white/[0.08]` on dark, `black/[0.06]` on light) does most of the work shadows are usually called in to do.
- **Real radii.** 1–2px for chrome, 8–12px for cards, full for chips. Skip the default `rounded-2xl` reflex.
- **Motion has a job.** Every animation should answer "what state changed?". Hover lift, focus ring, page enter — fine. Decorative pulses on static elements — no.
- **Spacing scale.** Use 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Most spacing problems are someone reaching for 14 or 18.
- **Real content.** Lorem ipsum hides design problems. Use real copy from the project, even if you have to write it.
- **One accent.** Pick the accent color. Use it for the one thing the eye should land on. Stop using it after that.

## Avoid

- Three identical cards in a row, each with an icon, title, two-line description.
- Gradient text on the H1.
- Glassmorphism without a reason.
- Lottie animations on the landing.
- Default shadcn theme on a portfolio.
- Headlines that say "Welcome to my X" or "Experience the future of Y".

## Output should feel like

- Opinionated. There is a clear hierarchy, a clear voice.
- Restrained. Most of the surface is empty. The thing that matters has room.
- Specific to the subject. A musician's site does not look like a SaaS landing.

## Related

- [[humanizer]] — same instinct applied to writing.
- [[split-react-components]] — process discipline; this is taste discipline.
- [[skills-index]] — vault catalog.
