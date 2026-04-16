# evoFlowAI

AI-powered nutrition and training tracker with a unified coaching flow:
- log meals (image or text),
- log workouts,
- track calorie/macronutrient progress,
- get contextual day-level guidance from Evo Coach.

The repository is a TypeScript monorepo with web, backend, and shared packages.

## What Is Included

- `web` (Next.js 14 + Apollo Client): dashboard, chat, goals, stats, workouts
- `backend` (Apollo GraphQL + MongoDB): auth, food/workout logging, AI services
- `shared` (TypeScript): shared domain types
- `ios` (SwiftUI): early mobile client structure

## Core Product Flows

- **Meal Logging**: user describes a meal or uploads an image; AI estimates nutrition and stores it.
- **Workout Logging**: user logs training sessions (duration, calories burned, intensity).
- **Daily Brief**: dashboard combines nutrition + goals + workouts and returns actionable next steps.
- **Goals**: calorie/macro goals plus weekly training goals.
- **Coach Experience**: Evo persona with contextual coaching tips and encouragement.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Apollo Client, Framer Motion
- **Backend**: Node.js, Apollo Server, GraphQL Subscriptions, Mongoose, JWT
- **AI**: OpenAI API
- **Infra**: Docker Compose (optional), MongoDB

## Repository Structure

```text
evoFlowAI/
├── backend/         # GraphQL API, resolvers, models, services
├── web/             # Next.js app (App Router)
├── shared/          # Shared TypeScript types
├── ios/             # SwiftUI project (WIP)
├── docs/            # Setup and product docs
└── scripts/         # Utility scripts
```

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- MongoDB (local or Atlas)
- OpenAI API key (required for AI features)

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp web/.env.local.example web/.env.local
```

3. Build shared package (types consumed by backend/web):

```bash
npm run build:shared
```

4. Run apps:

```bash
npm run dev
```

This starts:
- web: [http://localhost:3000](http://localhost:3000)
- backend GraphQL: [http://localhost:3001/graphql](http://localhost:3001/graphql)

## Docker

Use one of the compose files in project root:

```bash
docker-compose up --build
# or
docker-compose -f docker-compose.local.yml up --build
```

## Useful Scripts

From repository root:

- `npm run dev` - run backend + web in parallel
- `npm run build` - build shared, backend, and web
- `npm run build:shared` - build shared package only
- `npm run build:backend` - build backend only
- `npm run build:web` - build web only

Workspace-specific:

- `cd web && npm run type-check`
- `cd web && npm run lint`
- `cd backend && npm run build`

## Environment Variables

### Backend (`backend/.env`)

Important keys:
- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `OPENAI_TEMPERATURE` (optional)

### Web (`web/.env.local`)

Important keys:
- `NEXT_PUBLIC_GRAPHQL_URL`
- `NEXT_PUBLIC_GRAPHQL_WS_URL`

## Security Notes

- Never commit real credentials (`.env`, `.env.local`, private keys, tokens).
- The repo ignores common env files; keep secrets local.
- Rotate credentials immediately if they are ever exposed.

## Current Status

Implemented and actively used:
- JWT auth (+ password reset flow),
- meal logging with AI analysis,
- workout logging and day-level energy balance,
- dashboard brief with coaching tips,
- goals management (nutrition + weekly training goals),
- unified app shell/navigation and loading states.

## Documentation

- Setup: `docs/SETUP.md`
- Contribution process: `CONTRIBUTING.md`

## License

MIT - see `LICENSE`.
