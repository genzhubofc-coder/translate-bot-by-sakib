# Telegram Translation Bot Admin

A full-stack Telegram bot management system — auto-translates between Bangla (Bengali) and English, with a production-ready admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/admin-dashboard run dev` — run the admin dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret
- Optional env: `TELEGRAM_BOT_TOKEN` — set via admin dashboard Settings page

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**Change these immediately after first login via the Admins page.**

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + session auth (bcrypt + express-session + connect-pg-simple)
- Bot: Telegraf (Telegram bot framework)
- Translation: google-translate-api-x with HTTP fallback
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, Recharts, shadcn/ui, Wouter
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users, translations, admins, settings, bot_statistics
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/bot.ts` — Telegraf bot logic
- `artifacts/api-server/src/lib/translator.ts` — Language detection + translation
- `artifacts/api-server/src/lib/settings.ts` — Bot settings CRUD
- `artifacts/api-server/src/lib/seed.ts` — Initial data seeder
- `artifacts/admin-dashboard/src/` — React admin frontend

## Architecture decisions

- Contract-first OpenAPI: spec gates codegen which gates frontend hooks
- Bot token managed via admin Settings page (stored in DB), not env var
- Session auth (not JWT) — sessions stored in PostgreSQL via connect-pg-simple
- Translation uses google-translate-api-x with an HTTP fallback to the public Google API
- Language detection is Unicode-range based: >20% Bangla chars = Bangla

## Product

- Telegram bot auto-detects Bangla↔English and translates both ways
- Admin dashboard: login, dashboard overview, user management, translation logs, analytics charts, settings, admin accounts
- Bot commands: /start, /help, /language, /stats

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing DB schema run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- Bot token is stored in the `settings` table — configure it on the Settings page
- After updating the bot token the server auto-restarts the bot process
- The seeder runs once on startup (skipped if data already exists)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
