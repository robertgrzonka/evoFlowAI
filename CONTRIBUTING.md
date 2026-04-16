# Contributing to evoFlowAI

Thanks for helping improve evoFlowAI.
This guide explains how to contribute safely and consistently across the monorepo.

## Scope

Repository workspaces:
- `backend` - GraphQL API and AI/business logic
- `web` - Next.js app
- `shared` - shared TypeScript types
- `ios` - SwiftUI app (early stage)

## Getting Started

1. Create a branch from the default branch:

```bash
git checkout -b feature/short-description
```

2. Install dependencies from root:

```bash
npm install
```

3. Configure local env files:

```bash
cp backend/.env.example backend/.env
cp web/.env.local.example web/.env.local
```

4. Build shared package (required after type changes):

```bash
npm run build:shared
```

5. Start development:

```bash
npm run dev
```

## Branch Naming

Use clear prefixes:
- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `refactor/<name>`

## Commit Messages

Prefer concise, imperative messages.

Examples:
- `feat: add workout weekly goals to preferences`
- `fix: filter chat subscription by user id`
- `docs: rewrite onboarding and contribution guide`

## Definition of Done

Before opening a PR, run relevant checks:

```bash
# from root (full build)
npm run build

# workspace checks (as needed)
cd web && npm run type-check && npm run lint
cd backend && npm run build
```

Also verify:
- no runtime errors in browser console for changed flows,
- no obvious UI regressions on desktop and mobile breakpoints,
- changed GraphQL fields are wired in schema + resolver + frontend queries/mutations.

## Working With Shared Types

If you change `shared/src/types.ts`:
1. Build shared: `npm run build:shared`
2. Rebuild backend and type-check web
3. Ensure all workspace imports still compile

## Pull Request Checklist

Include in PR description:
- **What changed** (short summary)
- **Why it changed** (problem/user value)
- **How it was tested** (commands + manual steps)
- **Screenshots/GIFs** for UI changes
- **Breaking changes** (if any)

## Security Requirements

Never commit:
- `.env`, `.env.local`, secret tokens, private keys, credentials
- real API keys in docs/examples

If a secret is exposed by mistake:
1. Rotate/revoke it immediately
2. Remove it from tracked files
3. Note remediation steps in the PR

For vulnerabilities, avoid public disclosure until maintainers are informed.

## Documentation Standards

Update docs whenever behavior changes:
- `README.md` for setup/product overview
- `CONTRIBUTING.md` for workflow/tooling changes
- relevant docs in `docs/` for deeper implementation details

Keep docs practical and command-oriented.

## Coding Guidelines (Project-Specific)

- Use TypeScript consistently.
- Keep solutions simple and reusable.
- Reuse existing components/patterns before creating new abstractions.
- Prefer explicit naming and small, testable units.
- Add comments only where logic is non-obvious.

## Review Expectations

Reviewers focus on:
- correctness and regressions,
- security and secret handling,
- API/schema consistency,
- UX clarity for changed screens,
- maintainability.

Thanks again for contributing.

