---
id: '004'
created: 2026-05-19
updated: 2026-05-19
status: active
---

# Task: Consolidate duplicate Registry utilities and fix mutable Dashboard state

## Priority

P2 — Independent cleanup that reduces maintenance surface. Does not block or depend on the P1 tasks but is safe to pursue in parallel once Task 001 is merged.

## Dependencies

- No task dependency; can start any time after Task 001 is merged.
- No ADR dependency; these are ordinary implementation details with no architectural decisions.

## Assignability

**AFK** — all three changes are fully specified; no architectural decisions remain open.

## Context

Three related problems in the legacy Registry layer:

**1. Duplicated `generateUniqueSlug` function** (`datasource-registry.ts:81-93` and `question-registry.ts:75-87`): both files contain an identical slug-deduplication loop. The only difference is the lookup function called (`getDatasourceBySlug` vs `getQuestionBySlug`). Any bug fix or behaviour change must be applied in two places.

**2. Mutable exported Dashboard state** (`dashboard-registry.ts:67-71`): `dashboardList` is exported as a `const` reference to a mutable array, and `dashboardRegistry` is exported as a mutable plain object. `addDashboard()` mutates both directly via `.push()` and property assignment. Any consumer holding a reference sees stale state. The array and map can diverge if a mutation path updates one but forgets the other.

**3. Duplicate `generateUniqueSlug` also missing from `dashboard-registry.ts`**: the dashboard registry uses an inline loop with `let i = 1` (lines 78-81) instead of a shared function. A third copy that also needs to be consolidated.

The fix for (1) and (3) is to extract `generateUniqueSlug(base, exists)` to `src/shared/utils/slug.ts` and call it from all three registries. The fix for (2) is to replace the parallel array+object structure with a single private `Map<string, DashboardEntry>` and expose read functions instead of the mutable exports.

## Use Cases

- **Feature**: Slug generation for new Datasources, Questions, and Dashboards
- **Scenario**: Developer adds a fourth entity type that needs unique slugs
- **Given** `generateUniqueSlug` is in `src/shared/utils/slug.ts`
- **When** the developer imports it
- **Then** they get consistent deduplication behaviour without copy-pasting

- **Feature**: Dashboard list read
- **Scenario**: Component reads the dashboard list
- **Given** `addDashboard()` was just called
- **When** any code calls `dashboardList`
- **Then** it sees the updated list (no stale-reference risk)

## Definition of Ready

- `src/shared/utils/slug.ts` does not yet exist; it will be created.
- The `generateUniqueSlug` signature in `datasource-registry.ts` and `question-registry.ts` is identical except for the lookup argument — the abstraction is clear.

## Functional Requirements

- `FR-001`: A `generateUniqueSlug(base: string, exists: (slug: string) => boolean): string` function is created in `src/shared/utils/slug.ts`.
- `FR-002`: `datasource-registry.ts`, `question-registry.ts`, and `dashboard-registry.ts` call `generateUniqueSlug` from `src/shared/utils/slug.ts` instead of each containing their own inline loop.
- `FR-003`: `dashboardList` is no longer exported as a mutable array. All reads go through a `getDashboards()` function that returns a defensive copy or the Map's values.
- `FR-004`: `dashboardRegistry` (plain mutable object) is replaced internally by a `Map<string, DashboardEntry>`. `getDashboardBySlug(slug)` continues to work identically from the caller's perspective.
- `FR-005`: `addDashboard()` and `deleteDashboard()` update the internal Map atomically; there is no parallel array to keep in sync.

## Non-Functional Requirements

- `NFR-001`: All existing callers of `getDashboardBySlug()`, `dashboardList`, `addDashboard()`, and `deleteDashboard()` continue to work without change to their call sites.
- `NFR-002`: The slug generation behaviour (lowercase, hyphen-separated, collision suffix `-2`, `-3`, etc.) is unchanged.

## Observability Requirements

- `OBS-001`: No new observability requirements.

## Acceptance Criteria

- `AC-001`: **Given** two calls to `addDatasource()` with the same base name, **When** both complete, **Then** the resulting slugs follow the `${base}` / `${base}-2` pattern, using the shared `generateUniqueSlug` from `slug.ts`.
- `AC-002`: **Given** `addDashboard()` is called, **When** `getDashboards()` is called immediately after, **Then** the new dashboard appears in the returned list.
- `AC-003`: **Given** `dashboardList` is referenced before `addDashboard()`, **When** `addDashboard()` runs, **Then** existing references reflect the new state (no stale snapshot via the old exported mutable array).
- `AC-004`: **Given** `getDashboardBySlug(slug)` is called with an existing slug, **When** the dashboard was added via `addDashboard()`, **Then** the correct `DashboardConfig` is returned.

## Required Tests

### Unit Tests

- `UT-001`: Call `generateUniqueSlug('my-name', () => false)`; assert result is `'my-name'`. Covers `FR-001`.
- `UT-002`: Call `generateUniqueSlug('my-name', (s) => s === 'my-name')`; assert result is `'my-name-2'`. Covers `FR-001`.
- `UT-003`: Call `generateUniqueSlug('my-name', (s) => ['my-name', 'my-name-2'].includes(s))`; assert result is `'my-name-3'`. Covers `FR-001`.
- `UT-004`: Call `addDashboard(config)`, then call `getDashboards()`; assert the returned list contains the new dashboard. Covers `FR-003`, `AC-002`.
- `UT-005`: Call `deleteDashboard(slug)`, then call `getDashboardBySlug(slug)`; assert `undefined` is returned. Covers `FR-004`, `FR-005`.

### Integration Tests

Not applicable — slug generation and in-memory state are pure functions; no cross-boundary interactions.

### Smoke Tests

Not applicable — no build or startup path changes.

### End-to-End Tests

Not applicable — no user-visible behaviour changes; the Datasource/Question/Dashboard creation flows produce identical results.

### Regression Tests

Not applicable — no known previous defects in slug generation or dashboard state.

### Performance Tests

Not applicable — all changes are O(1) or O(N) operations on small in-memory collections.

### Security Tests

Not applicable — no authentication, authorization, or input handling changes.

### Usability Tests

Not applicable — no user-visible changes.

### Observability Tests

Not applicable — no new telemetry.

## Definition of Done

- `src/shared/utils/slug.ts` exists with `generateUniqueSlug` exported and unit-tested.
- `datasource-registry.ts`, `question-registry.ts`, and `dashboard-registry.ts` import `generateUniqueSlug` from `src/shared/utils/slug.ts`.
- `dashboard-registry.ts` no longer exports a mutable array or object; callers use `getDashboards()` and `getDashboardBySlug()`.
- All unit tests (`UT-001` through `UT-005`) pass.
- `npm run typecheck`, `npm run lint`, and `npm run knip` pass without new errors.
- Existing integration and component tests continue to pass.
