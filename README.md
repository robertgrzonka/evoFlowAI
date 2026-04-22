# evoFlowAI

AI-powered nutrition and training tracker with a unified coaching flow: log meals (image or text), log workouts, track calorie and macro progress, and get contextual guidance from **Evo** (dashboard, chat, and **Evo Coach Pro** weekly plans).

The repository is a **TypeScript monorepo** (`npm` workspaces): `web`, `backend`, and `shared`.

## What is included

| Package | Role |
|--------|------|
| **`web`** | Next.js 15 (App Router), React, Tailwind, Apollo Client — dashboard, chat, goals, stats, meals, workouts, **Coach Pro**, settings (EN/PL UI) |
| **`backend`** | Apollo Server GraphQL + MongoDB (Mongoose), JWT auth, OpenAI-backed food analysis, Coach Pro generation, subscriptions for chat |
| **`shared`** | Shared TypeScript types (`@evoflowai/shared`) consumed by web and backend |
| **`ios`** | SwiftUI client (early / WIP structure) |

## Core product flows

- **Meal logging** — Describe a meal or upload a photo; AI estimates nutrition and stores `FoodItem` records.
- **Workout logging** — Sessions with duration, calories, intensity.
- **Dashboard** — Day snapshot: remaining calories/macros, workouts, cached AI insights where applicable.
- **Goals** — Calorie/macro targets and weekly training goals.
- **Chat** — Evo thread with optional meal-log shortcuts from natural language.
- **Evo Coach Pro** — Multi-step setup, long-running **weekly** nutrition + training plan (GraphQL), AI-enriched recipes and drawers; plan is stored per user until regenerated.

## Tech stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Apollo Client, Framer Motion  
- **Backend**: Node.js, Apollo Server, GraphQL (HTTP + WebSocket subscriptions), Mongoose, JWT  
- **AI**: OpenAI Chat Completions (JSON / vision); GPT-5 family supported with documented env tuning  
- **Data**: MongoDB (local or Atlas)  
- **Optional**: Docker Compose for local Mongo + API wiring (`docker-compose.local.yml`)

## Repository layout

```text
evoFlowAI/
├── backend/          # GraphQL schema, resolvers, models, services (OpenAI, caches)
├── web/              # Next.js app (src/app, components, lib/graphql, i18n)
├── shared/           # Shared types → build before backend/web in CI
├── ios/              # SwiftUI (WIP)
├── docs/             # SETUP, Evo personality, etc.
├── scripts/          # Utility scripts (see scripts/README.md)
└── package.json      # Root workspaces + dev scripts
```

## Prerequisites

- **Node.js** 18+ (LTS recommended)  
- **npm** 9+  
- **MongoDB** — local instance or [Atlas](https://www.mongodb.com/atlas) (connection string with **database name** in the path, e.g. `…/evoflowai`)  
- **OpenAI API key** — required for AI features (meal analysis, chat, Coach Pro)

## Quick start (local)

1. **Install** (workspace hoists dependencies from root):

   ```bash
   npm install
   ```

2. **Environment files**

   ```bash
   cp backend/.env.example backend/.env
   cp web/.env.local.example web/.env.local
   ```

   Edit `backend/.env`: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.  
   Edit `web/.env.local`: `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_GRAPHQL_WS_URL` (see `web/.env.local.example`).

   **GPT-5 / latency:** `backend/.env.example` documents `OPENAI_REASONING_EFFORT`, `OPENAI_VERBOSITY`, `OPENAI_COACH_PRO_GPT5_COMPLETION_BUDGET`, and related knobs.

3. **Build shared package** (types for backend and web):

   ```bash
   npm run build:shared
   ```

4. **Run dev** (backend + web in parallel):

   ```bash
   npm run dev
   ```

   - Web: [http://localhost:3000](http://localhost:3000)  
   - GraphQL HTTP: [http://localhost:3001/graphql](http://localhost:3001/graphql)  
   - GraphQL WS: same host, path configured for subscriptions (see web env example).

5. **Optional — backend on GPT-5 without editing `.env`:**

   ```bash
   npm run dev:gpt5
   ```

   Runs `OPENAI_MODEL=gpt-5` for the backend process (see `backend/package.json` script `dev:gpt5`).

## Docker

From the repo root (pick the compose file you use locally):

```bash
docker compose up --build
# or
docker compose -f docker-compose.local.yml up --build
```

Compose can pass `MONGODB_URI` from a root `.env`; details in `docs/SETUP.md`.

## Useful scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + web concurrently |
| `npm run dev:gpt5` | Same, backend uses GPT-5 via env |
| `npm run build` | `build:shared` → `build:backend` → `build:web` |
| `npm run build:shared` | Compile `@evoflowai/shared` |
| `npm run build:backend` | `tsc` backend |
| `npm run build:web` | `next build` |

**Package-level checks**

```bash
cd web && npm run type-check && npm run lint
cd backend && npm run build
```

## Environment variables (summary)

| Location | Keys (non-exhaustive) |
|----------|------------------------|
| `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ALLOWED_ORIGINS`, optional GPT-5 / Coach Pro budgets — **see `backend/.env.example`** |
| `web/.env.local` | `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_GRAPHQL_WS_URL` |

Never commit real secrets; `.env` / `.env.local` are gitignored.

## Security

- Do not commit credentials or private keys.  
- Rotate any key that was exposed.  
- Use strong `JWT_SECRET` in production.

## Documentation

| Doc | Topic |
|-----|--------|
| [`docs/SETUP.md`](docs/SETUP.md) | Detailed install, Atlas notes, Jest env, compose |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution process |
| [`docs/evo-personality-system.md`](docs/evo-personality-system.md) | Evo coaching tone / prompts |
| [`docs/frontend-atomic-audit.md`](docs/frontend-atomic-audit.md) | Frontend structure notes |

## License

MIT — see [`LICENSE`](LICENSE).
