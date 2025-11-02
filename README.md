# Website

Modern website built with Next.js, Hono API, and Turborepo.

## Tech Stack

### Frontend (apps/www)
- Next.js 16 with App Router
- React 19
- shadcn/ui components
- next-intl for internationalization
- Tailwind CSS
- TypeScript

### Backend (apps/api)
- Hono framework
- Bun runtime
- PostgreSQL database
- Drizzle ORM

### Infrastructure
- Turborepo for monorepo management
- pnpm for package management
- Docker Compose for local development
- Biome for code formatting and linting
- Lefthook for Git hooks

## Getting Started

### Prerequisites
- pnpm >= 10.0.0
- Bun >= 1.2.0
- Node.js >= 20.0.0
- Docker and Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Website
```

2. Install dependencies:
```bash
pnpm install
```

3. Start PostgreSQL with Docker Compose:
```bash
docker compose up -d
```

4. Set up environment variables:
```bash
cp .env.example .env
```

5. Run database migrations:
```bash
cd apps/api
pnpm db:generate
pnpm db:migrate
```

6. Start development servers:
```bash
# From root
pnpm dev
```

This will start:
- Next.js app on http://localhost:3000
- Hono API on http://localhost:3001

## Project Structure

```
.
├── apps/
│   ├── www/          # Next.js frontend
│   └── api/           # Hono API backend
├── .github/           # GitHub templates
├── .cursor/           # Cursor AI rules
└── compose.yml        # Docker Compose configuration
```

## Available Scripts

### All Apps
From root:
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm type-check` - Type check all apps

### Individual Apps
- `pnpm www:dev` - Start Next.js app only
- `pnpm www:build` - Build Next.js app only
- `pnpm www:start` - Start Next.js production server
- `pnpm api:dev` - Start Hono API only
- `pnpm api:build` - Build Hono API only
- `pnpm api:start` - Start Hono API production server

### Code Quality
- `pnpm format` - Format code with Biome
- `pnpm format:check` - Check code formatting
- `pnpm lint:biome` - Lint and fix with Biome
- `pnpm check` - Run all Biome checks and fixes
- `pnpm check:ci` - Run Biome checks in CI mode (no fixes)

## Database

PostgreSQL is managed through Docker Compose. The database connection string should be set in your `.env` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/website
```

### Database Commands

```bash
cd apps/api
pnpm db:generate    # Generate migrations from schema
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio
```

## License

Private project.
