# OpenBookLM

An open-source, model-agnostic AI research environment where every project is a workspace, every document is a source, and every operation is conversational.

OpenBookLM adopts the core strengths of NotebookLM — source-grounded reasoning, rich artifacts, and an AI-first workflow — and re-architects them into a fully open, customizable platform. Projects behave like repos rather than opaque notebooks tied to a single model provider.

> See [PROJECT.md](./PROJECT.md) for the full vision, data model, architecture decisions, and V1 roadmap.

## Tech Stack

- **Runtime** — [Bun](https://bun.sh)
- **Frontend** — [Next.js 16](https://nextjs.org) (App Router, RSC)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Backend** — [Hono](https://hono.dev)
- **API** — [tRPC](https://trpc.io) (end-to-end type safety)
- **Auth** — [Better Auth](https://better-auth.com)
- **Database** — [Neon Serverless Postgres](https://neon.tech) via [Drizzle ORM](https://orm.drizzle.team)
- **Monorepo** — [Turborepo](https://turbo.build)
- **Lint/Format** — oxlint + oxfmt

## Getting Started

```bash
bun install
```

### Environment

Create `apps/server/.env` with your database connection string, auth secret (min 32 chars), auth URL pointing to the server origin, and CORS origin pointing to the web origin. Create `apps/web/.env` with `NEXT_PUBLIC_SERVER_URL` pointing to the server origin. See `packages/env/src/server.ts` and `packages/env/src/web.ts` for the full list of required variables.

### Database

```bash
bun run db:push
```

### Development

```bash
bun run dev
```

Frontend runs on port 3001, backend on port 3000.

## Project Structure

```
openbooklm/
├── apps/
│   ├── web/             # Next.js 16 frontend
│   └── server/          # Hono + tRPC backend
├── packages/
│   ├── api/             # tRPC routers & business logic
│   ├── auth/            # Better Auth configuration
│   ├── db/              # Drizzle schema & queries
│   ├── env/             # Environment variable validation
│   ├── ui/              # Shared shadcn/ui components
│   └── config/          # Shared TypeScript config
├── PROJECT.md           # Vision, data model, architecture
├── AGENTS.md            # AI agent development instructions
└── README.md            # This file
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start both frontend and backend |
| `bun run dev:web` | Start frontend only (port 3001) |
| `bun run dev:server` | Start backend only (port 3000) |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript type checking |
| `bun run check` | Lint + format (oxlint + oxfmt) |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |

## UI Customization

Shared components live in `packages/ui`. Add new shadcn primitives:

```bash
bunx --bun shadcn@latest add <component> -c apps/web
```

Import shared components:

```tsx
import { Button } from "@openbooklm/ui/components/button";
```
