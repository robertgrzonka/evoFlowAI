# Frontend Atomic Audit

## Scope

Audit focused on layout consistency and reusable UI structure across authenticated pages:

- `dashboard`
- `chat`
- `meals`
- `stats`
- `workouts`
- `goals`
- `settings`

## Findings

- Top navigation/back affordance was duplicated with small spacing/style differences across pages.
- Page-level header patterns were implemented ad hoc instead of reusable composition.
- Chat and meal workflows had mixed responsibilities in one screen, increasing cognitive load.

## Implemented In This Pass

### Atomic Components

- **Atom**: `web/src/components/ui/atoms/BackLink.tsx`
  - Single source of truth for back navigation affordance.

- **Molecule**: `web/src/components/ui/molecules/PageTopBar.tsx`
  - Composes `BackLink` with optional right-side action/content.
  - Used to stabilize top layout across pages.

### Layout Refactor

- Unified top bars on:
  - `web/src/app/chat/page.tsx`
  - `web/src/app/meals/page.tsx`
  - `web/src/app/workouts/page.tsx`
  - `web/src/app/stats/page.tsx`
  - `web/src/app/goals/page.tsx`
  - `web/src/app/settings/page.tsx`

### IA / UX Separation

- `Chat` now handles conversation intents (`General` / `Coach`).
- `Meals` is a dedicated logging page with meal form + entries list.
- Navigation updated to expose both `Chat` and `Meals` as separate primary destinations.

## Next Atomic Design Iteration

1. Extract reusable **organisms**:
   - `PageSectionCard`
   - `MetricsGrid`
   - `QuickActionGrid`
2. Extract reusable **templates**:
   - `DataListTemplate` (loading/empty/list/error states)
   - `FormTemplate` (label/input/help/action slots)
3. Remove remaining repeated inline card and heading markup from page files.
4. Add Storybook-style examples (or local docs page) for each atom/molecule/organism.
