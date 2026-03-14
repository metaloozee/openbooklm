# OpenBookLM

## Cursor Cloud specific instructions

### Architecture

Turborepo monorepo with Bun (v1.3.9) as package manager and runtime. Two apps plus shared packages:

| Service                             | Port       | Start command        |
| ----------------------------------- | ---------- | -------------------- |
| Backend (Hono + tRPC + Better Auth) | 3000       | `bun run dev:server` |
| Frontend (Next.js 16)               | 3001       | `bun run dev:web`    |
| Both together                       | 3000, 3001 | `bun run dev`        |

### Environment variables

Server env file goes in `apps/server/.env`. Web env file goes in `apps/web/.env`. Required variables are defined in `packages/env/src/server.ts` and `packages/env/src/web.ts`. The Drizzle config reads the server `.env` from `../../apps/server/.env` relative to the db package.

Secrets injected as environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_SERVER_URL`. You must write these into `.env` files before starting services (they are gitignored).

### Database

Uses Neon Serverless Postgres via `@neondatabase/serverless` (HTTP driver). Push schema with `bun run db:push`. The driver only works with Neon-compatible endpoints (cloud Neon or neon-proxy); a plain local PostgreSQL will not work.

### Lint, format, and type check

- `bun run check` runs oxlint + oxfmt (format with `--write`)
- `bun run check-types` runs TypeScript across packages with `check-types` script
- Git hooks via lefthook run oxlint/oxfmt on staged files

### CORS caveat

The backend CORS is configured with `origin: env.CORS_ORIGIN`. When testing auth endpoints with `curl`, include `-H "Origin: $CORS_ORIGIN"` or requests return 500. The browser handles this automatically.

### Build

`bun run build` builds both server (tsdown) and web (Next.js).
