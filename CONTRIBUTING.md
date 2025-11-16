# Contributing Guidelines

Thanks for your interest in contributing to the Website project. This document outlines how to set up your environment, follow our coding standards, and submit changes for review.

## Ground Rules
- Follow the [Code of Conduct](./CODE_OF_CONDUCT.md) in all interactions.
- Discuss large changes in an issue before opening a pull request.
- Keep pull requests focused and avoid mixing unrelated changes.
- All user-facing text must use the existing `next-intl` localization flow (`apps/www/src/locals`). Never hardcode UI strings.
- Prefer functional programming patterns. Avoid mutating inputs and keep components pure.

## Getting Started
1. Fork the repository and clone your fork.
2. Install pnpm (version `>=10`).
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Duplicate the environment template and adjust values as needed:
   ```bash
   cp env.example .env
   ```
5. Start the development servers:
   ```bash
   pnpm dev
   ```

## Branching & Commits
- Create feature branches using `type/short-description` (e.g. `feat/new-terminal-copy`).
- Follow the conventional commit format described in the README (`type(scope): subject` with a bullet list body).
- Keep commit history clean; rebase before opening a pull request.

## Coding Standards
- TypeScript strict mode: no `any`, implicit `undefined`, or untyped returns.
- React 19 / Next.js 16 best practices:
  - Use server components unless client-side interactivity is required.
  - Co-locate UI in `apps/www/src/components` and prefer small, composable units.
  - Use Tailwind CSS utilities for styling; avoid custom global CSS.
- API code lives under `apps/api`. Follow existing Hono + Drizzle patterns for routes, schema, and services.
- Internationalization:
  - Add matching keys to `apps/www/src/locals/en.json` and `apps/www/src/locals/de.json`.
  - Use `useTranslations` or server helpers to read localized strings.
- Tests: provide integration or unit coverage when adding new logic. Align with existing testing setup when present.

## Checks Before Opening a PR
Run the following commands and ensure they pass:
```bash
pnpm lint
pnpm type-check
```
If your change affects the API or infrastructure, also run relevant scripts (e.g. migrations) and document any manual steps in the PR description.

## Submitting a Pull Request
1. Ensure your branch is rebased on `main`.
2. Open a pull request with a clear title and description.
3. Include screenshots or screen recordings for UI changes.
4. Reference related issues using `Closes #ID` when applicable.
5. Be ready to incorporate review feedback. We favor iterative refinement over monolithic rewrites.

## Reporting Security Issues
For vulnerabilities, follow the private process described in [SECURITY.md](./SECURITY.md). Do not open public issues for security matters.

We appreciate your contributions—thank you for helping improve the project!

