---
task: '010'
created: 2026-05-19
status: completed
---

# Implementation Summary: Consolidate Registry Utilities and Fix Mutable Dashboard State

## Files Changed

### New files

- `src/shared/utils/slug.ts` — `generateUniqueSlug(base, exists)` extracted here
- `src/shared/utils/slug.spec.ts` — UT-001, UT-002, UT-003

### Modified files

- `src/features/datasource/data/datasource-registry.ts` — removed local `generateUniqueSlug`; calls shared function
- `src/features/question/data/question-registry.ts` — removed local `generateUniqueSlug`; calls shared function
- `src/features/dashboard/data/dashboard-registry.ts` — replaced mutable `dashboardList` array and `dashboardRegistry` plain object with a private `Map<string, DashboardEntry>`; exported `getDashboards()` instead of `dashboardList`; uses shared `generateUniqueSlug`
- `src/features/dashboard/dashboard-service.ts` — re-exports `getDashboards` instead of `dashboardList`
- `src/features/dashboard/ui/dashboard-list/dashboard-list.ts` — callers updated to `getDashboards()`
- `src/features/dashboard/data/dashboard-registry.spec.ts` — updated to `getDashboards()`, removed `dashboardRegistry` references, added UT-004 and UT-005, updated slug collision expectation from `-1` to `-2`
- `src/features/dashboard/model/dashboard-config.spec.ts` — replaced `dashboardRegistry[slug]` with `getDashboardBySlug(slug)`

## Behavior Implemented

- **FR-001/FR-002**: `generateUniqueSlug(base, exists)` lives in `src/shared/utils/slug.ts`. All three registries import and use it instead of their own inline loops.
- **FR-003**: `dashboardList` is no longer exported. `getDashboards()` returns a snapshot (`[...map.values()]`), so callers can never hold a stale reference to the internal store.
- **FR-004/FR-005**: `dashboard-registry.ts` now has a single `Map<string, DashboardEntry>` as the source of truth. `addDashboard` and `deleteDashboard` update the map atomically; there is no parallel array.
- **Slug collision suffix change for dashboards**: The old dashboard loop produced `-1`, `-2`. The shared function produces `-2`, `-3` (matching datasource/question behavior). The existing spec expectation was updated accordingly.

## Tests Added or Updated

- `src/shared/utils/slug.spec.ts` — 3 new tests (UT-001, UT-002, UT-003)
- `src/features/dashboard/data/dashboard-registry.spec.ts` — 2 new tests (UT-004, UT-005); existing tests updated to use `getDashboards()` and `getDashboardBySlug()` in place of removed exports

## Validations Run

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run knip` — pre-existing findings only (`http-error.ts`, `ClientServerContainer`), none introduced by this task
- `npx vitest run` — 48 tests pass across all affected spec files; full suite 786 tests pass

## Accessibility

Not applicable — no UI changes beyond a pure function rename (`dashboardList` → `getDashboards()`).

## ADRs Updated

None — this is an implementation detail consolidation with no architectural decisions.

## Intentional Non-Applicable Test Categories

- Integration, smoke, e2e, regression, performance, security, usability, observability — unchanged from the task's own assessment; slug generation and in-memory state are pure functions.

## Unresolved Assumptions

None.
