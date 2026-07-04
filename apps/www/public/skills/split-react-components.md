---
title: Split React Components
tags: [skill, react, frontend]
created: 2026-05-10
updated: 2026-05-10
summary: Extract inlined sub-components, icons, and data constants out of bloated React files into single-responsibility files.
aliases: [extract-components, component-slop, deslop-react]
---

# Split React Components

One file, one component, its own types, its own hooks. Multiple components in one file is slop — it bloats the host, re-creates sub-components on every render, and makes the file impossible to navigate.

## When to use

- A `.tsx` file contains more than one exported or inline component.
- SVG icons are defined inside the component that uses them.
- A data constant (config array, static SVG string) takes more than ~5 lines.
- User says "split components", "clean up this file", or "component slop".

## When to skip

- Tiny styled wrappers (< 5 lines) tightly coupled to parent markup.
- Next.js app router conventions (`loading.tsx`, `error.tsx`, `layout.tsx`).
- Test files.

## How to apply

1. **Scan** — read the target file(s), list every component definition.
2. **Classify** — primary export vs. inlined sub-component or helper.
3. **Plan** — for each extraction: destination path (follow project kebab-case conventions), which imports/types/constants travel with it, what the parent needs to import after.
4. **Execute** — create new files, remove inlined definitions, add imports. Preserve `'use client'` / `'use server'` directives.
5. **Verify** — no circular imports, lints pass on all modified files.

**Naming conventions** — icons → sibling `icons.tsx` or `icons/` subfolder; data constants → named after the constant (e.g. `logo-svg.ts`); types → co-locate with the component that owns them.

**Batch mode** — glob `**/*.tsx`, flag files with 2+ components where at least one isn't the primary export, present a summary table, ask before executing (or proceed immediately if the user said "fix them all").

## Output should feel like

- Each file has one named export that is its obvious owner.
- No `const Icon = () => ...` buried inside another component's function body.
- Parent file shorter, clearer, and easier to diff.

## Related

- [[frontend-design]] — broader code quality for frontends.
- [[skills-index]] — vault catalog.
