<a id="readme-top"></a>

<h1 align="center">Portfolio Website</h1>

<p align="center">
  Personal website showcasing projects, self-hosted services, and an AI-assisted visitor terminal.<br/>
  Delivered as a TypeScript monorepo that pairs a Next.js 16 frontend with a Hono API backend.
</p>

<div align="center">
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </a>
  <a href="https://next-intl-docs.vercel.app/">
    <img src="https://img.shields.io/badge/next--intl-localized-blue" alt="next-intl" />
  </a>
  <a href="https://hono.dev/">
    <img src="https://img.shields.io/badge/Hono-API-orange" alt="Hono API" />
  </a>
  <a href="https://orm.drizzle.team/">
    <img src="https://img.shields.io/badge/Drizzle%20ORM-PostgreSQL-0f172a" alt="Drizzle ORM + PostgreSQL" />
  </a>
  <a href="https://www.langchain.com/">
    <img src="https://img.shields.io/badge/LangChain-AI%20orchestration-2e8b57" alt="LangChain" />
  </a>
  <a href="https://github.com/toon-format/toon">
    <img src="https://img.shields.io/badge/Toon%20Format-token%20packing-7c3aed" alt="Toon Format" />
  </a>
  <a href="https://bun.sh/">
    <img src="https://img.shields.io/badge/Bun-runtime-000000?logo=bun&logoColor=white" alt="Bun runtime" />
  </a>
  <a href="https://turbo.build/repo">
    <img src="https://img.shields.io/badge/Turborepo-monorepo-FF6B6B" alt="Turborepo" />
  </a>
  <a href="https://pnpm.io/">
    <img src="https://img.shields.io/badge/pnpm-10.20-4a4a4a?logo=pnpm&logoColor=white" alt="pnpm" />
  </a>
</div>

<br />

<p align="center">
  <img src="docs/assets/hero-preview.png" alt="Portfolio website hero preview" width="880" />
</p>



## Table of Contents
- [Overview](#overview)
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Terminal Experience](#terminal-experience)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Community & Policies](#community--policies)
- [Maintainer](#maintainer)

## Overview
The website blends storytelling with real-time integrations. Visitors can explore professional highlights, current activity, curated tooling, and an interactive terminal that moderates and publishes community messages. All user-facing copy supports German and English through `next-intl`.

## Highlights
- **Interactive terminal**: Submit moderated messages that flow into a multilingual message feed with rate limiting and session persistence.
- **AI moderation pipeline**: Orchestrated with [LangChain](https://www.langchain.com/) and [OpenAI](https://platform.openai.com/), using [Toon Format](https://github.com/toon-format/toon) prompts to minimise token usage.
- **Live data integrations**: Background jobs pull from GitHub, Spotify, Jellyfin, and other services for the activity and self-hosted sections.
- **Two-language experience**: Server and client components read from `apps/www/src/locals`, offering a consistent bilingual UI.
- **Dynamic accent system**: Visitors can switch the accent palette, driving a site-wide glow theme showcased in the tools section.
- **Self-hosted showcase**: Dedicated section for infrastructure projects, powered by the same API that operates the terminal.

## Architecture
- **Monorepo** managed by Turborepo with shared TypeScript config and Biome formatting.
- **Web app** (`apps/www`): Next.js 16, Tailwind CSS, motion animations, server actions for data fetching, and localized content.
- **API** (`apps/api`): Hono server running on Bun with Drizzle ORM, PostgreSQL for persistence, Redis for terminal session state, and LangChain-driven OpenAI moderation.
- **Infrastructure**: `compose.yml` provisions PostgreSQL, Redis, the API, and the web frontend as separate services.
- **Shared tooling**: pnpm workspaces, Turbo pipelines, and a centralized environment file simplify local and production setup.

## Terminal Experience
The terminal is a core feature that mixes UX polish with backend automation:

- Each visitor receives a signed cookie-backed session with configurable quotas.
- Messages pass through an OpenAI moderation step before persisting to PostgreSQL.
- Redis tracks rate limits, and the API returns translated content for the live feed.
- LangChain chains prompts and system context while Toon Format compresses payloads to keep OpenAI token consumption predictable.
- The plan below summarizes the moderation and publishing flow implemented in `apps/api/src/services/terminal-*`:

<p align="center">
  <img src="docs/plan/terminal-plan.png" alt="Terminal moderation and publication flow" width="880" />
</p>

## Screenshots
<details>
  <summary>Show gallery</summary>

<p>Every screenshot from <code>docs/assets</code> is included below to illustrate the major flows.</p>

<figure>
  <img src="docs/assets/hero-preview.png" alt="Hero section with accent glow" width="880" />
  <figcaption>Hero Preview</figcaption>
</figure>

<figure>
  <img src="docs/assets/accent-color.png" alt="Accent selector and glow states" width="880" />
  <figcaption>Accent Color Controls</figcaption>
</figure>

<figure>
  <img src="docs/assets/activity.png" alt="Activity section with charts and cards" width="880" />
  <figcaption>Activity Feed</figcaption>
</figure>

<figure>
  <img src="docs/assets/projects.png" alt="Projects grid with hover states" width="880" />
  <figcaption>Projects Overview</figcaption>
</figure>

<figure>
  <img src="docs/assets/selfhosted-pt.png" alt="Self-hosted infrastructure cards" width="880" />
  <figcaption>Self-Hosted Services</figcaption>
</figure>

<figure>
  <img src="docs/assets/i18n-switch.png" alt="Language toggle for German and English" width="880" />
  <figcaption>Language Switcher</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-message.png" alt="Terminal input with system prompts" width="880" />
  <figcaption>Terminal Message Entry</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-approve.png" alt="Message approved notification" width="880" />
  <figcaption>Terminal Approval State</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-await-review.png" alt="Message queued for moderation" width="880" />
  <figcaption>Terminal Awaiting Review</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-limit.png" alt="Terminal rate limiting feedback" width="880" />
  <figcaption>Terminal Rate Limit</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-reject.png" alt="Rejected message feedback" width="880" />
  <figcaption>Terminal Rejection</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-iban.png" alt="Terminal IBAN masking preview" width="880" />
  <figcaption>Terminal IBAN Preview</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-iban-reject.png" alt="Rejected IBAN entry message" width="880" />
  <figcaption>Terminal IBAN Rejection</figcaption>
</figure>

<figure>
  <img src="docs/assets/terminal-language-switch.png" alt="Feed language toggle across locales" width="880" />
  <figcaption>Terminal Language Feed</figcaption>
</figure>
</details>

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 10 (declared in `package.json`)
- Docker (optional, required for running PostgreSQL and Redis locally via Compose)

### Installation
```bash
pnpm install
```

### Local Development
- Run both apps concurrently:
  ```bash
  pnpm dev
  ```
- Start the frontend only:
  ```bash
  pnpm www:dev
  ```
- Start the API only:
  ```bash
  pnpm api:dev
  ```

Additional scripts for linting, formatting, and database tasks live in the root `package.json`.

## Environment Variables
Copy the template and fill in your secrets before running any service:

```bash
# macOS / Linux
cp env.example .env

# Windows PowerShell
Copy-Item env.example .env
```

Key variables for production are documented in `env.example`. The snippet below shows the syntax expected by the Docker services:

```env
# Core URLs
NEXT_PUBLIC_API_URL=https://example.com/api
NEXT_INTERNAL_API_URL=http://api:3001

# Database
DATABASE_URL=postgresql://turborepo:password@localhost:5436/turborepo
DATABASE_URL_INTERNAL=postgresql://turborepo:password@postgres:5432/turborepo

# Redis
REDIS_HOST=localhost
REDIS_HOST_INTERNAL=redis
REDIS_PASSWORD=redis_password

# Integrations
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
DISCORD_USER_ID=
GITHUB_TOKEN=
PELICAN_API_URL=
PELICAN_API_KEY=
PELICAN_SITE_IDENTIFIER=
JELLYFIN_BASE_URL=
JELLYFIN_API_KEY=

# Terminal
TERMINAL_SESSION_COOKIE_NAME=user_id
TERMINAL_SESSION_TTL_SECONDS=86400
TERMINAL_SESSION_TEXT_LIMIT=3
TERMINAL_SESSION_COOKIE_DOMAIN=
TERMINAL_SESSION_COOKIE_SAME_SITE=None
OPENAI_API_KEY=
TERMINAL_OPENAI_MODEL=gpt-4.1-mini
```

## Production Deployment
The repository ships with a Docker Compose workflow tailored for production:

1. Fill `.env` with production-ready secrets and correct public URLs.
2. Build and start the stack:
   ```bash
   docker compose up -d --build
   ```
3. Services exposed by `compose.yml`:
   - `postgres` on port `5436` (maps to `5432` inside the container)
   - `redis` on port `6380`
   - `api` on port `3001`
   - `www` on port `3000`
4. Configure your reverse proxy or platform with:
   - `NEXT_PUBLIC_API_URL` pointing to the public API host (e.g. `https://api.example.com`)
   - `NEXT_INTERNAL_API_URL` referencing the internal Docker network URL (`http://api:3001`)

For upgrades, pull the latest code, rebuild the images, and rerun `docker compose up -d --build`.

## Project Structure

```text
apps/
  api/        # Hono API with Drizzle ORM and Redis-powered services
  www/        # Next.js frontend with motion-enhanced sections and i18n
docs/
  assets/     # Marketing and product screenshots
  plan/       # Terminal moderation diagram
env.example   # Environment variable template
compose.yml   # Production-ready Docker Compose stack
```

## Tech Stack
- **Frontend**: [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [motion/react](https://motion.dev/), [next-intl](https://next-intl-docs.vercel.app/), [Phosphor Icons](https://phosphoricons.com/).
- **Backend & AI**: [Hono](https://hono.dev/), [Drizzle ORM](https://orm.drizzle.team/), [PostgreSQL](https://www.postgresql.org/), [Redis](https://redis.io/), [LangChain](https://www.langchain.com/), [OpenAI](https://platform.openai.com/), [Toon Format](https://github.com/toon-format/toon).
- **Tooling**: [Turborepo](https://turbo.build/repo), [pnpm](https://pnpm.io/), [Biome](https://biomejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Bun](https://bun.sh/).
- **Infrastructure**: [Docker Compose](https://docs.docker.com/compose/), multi-stage Dockerfiles under `apps/www` and `apps/api`.

## Community & Policies
- Read our [Contributing Guidelines](CONTRIBUTING.md) before opening a pull request.
- Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
- Responsible disclosure steps are outlined in [SECURITY.md](SECURITY.md).
- The project is licensed under [GPL-3.0](LICENSE).

## Maintainer
Built and maintained by Skeptic. Reach out through the repository issue tracker for questions or feedback.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
