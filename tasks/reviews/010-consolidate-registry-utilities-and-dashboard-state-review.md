---
id: '010'
issue: 'tasks/issues/010-consolidate-registry-utilities-and-dashboard-state.md'
created: 2026-05-19
updated: 2026-05-19
---

# Review: Consolidate duplicate Registry utilities and fix mutable Dashboard state

## Related Task

- `tasks/issues/010-consolidate-registry-utilities-and-dashboard-state.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

| ID    | Level      | Requirement | Description                                                                                                                                                                                                                                                                                                                            | Evidence                                                                                                             |
| ----- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| F-001 | Suggestion | —           | `dashboard-list.stories.ts:53` contains a stale string comment reading `"Reads \`dashboardList\` from the registry"`. No code dependency — purely documentation copy.                                                                                                                                                                  | `src/features/dashboard/ui/dashboard-list/dashboard-list.stories.ts:53`                                              |
| F-002 | Suggestion | FR-002      | The name-to-slug normalization pattern (`.toLowerCase().trim().replace(...)`) is duplicated inline in `datasource-registry.ts` and `question-registry.ts`. FR-002 only required extracting the uniqueness loop; extracting normalization as a shared `nameToSlug` utility would further reduce duplication. Not required by this task. | `src/features/datasource/data/datasource-registry.ts:87–92`, `src/features/question/data/question-registry.ts:78–83` |
| F-003 | Suggestion | —           | `getDashboards()` is called three times per render cycle in `DashboardList` (getter `itemCount`, `_renderListItems` guard, and template). Each call spreads the Map. A local const inside `_renderListItems` would avoid redundant spreads; immaterial at the current scale.                                                           | `src/features/dashboard/ui/dashboard-list/dashboard-list.ts:35,86,101`                                               |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                 |
| ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `addDatasource` in `datasource-registry.ts:93` calls `generateUniqueSlug(normalizedSlug, (s) => !!getDatasourceBySlug(s))`, producing `${base}` then `${base}-2`. Existing spec test "addDatasource generates a unique slug from name" verifies two calls with the same name produce different slugs. |
| AC-002 | Pass   | `addDashboard` immediately sets `_entries.set(slug, entry)`; `getDashboards()` returns `[...this._entries.values()]`. UT-004 (line 105–111 in `dashboard-registry.spec.ts`) asserts the new slug appears in the list without a reload.                                                                |
| AC-003 | Pass   | The mutable `dashboardList` array export is removed entirely. `getDashboards()` returns a fresh snapshot on every call, so no caller can hold a reference that grows stale. `dashboard-list.ts` calls `getDashboards()` inline in each getter/template, not from a captured reference.                |
| AC-004 | Pass   | `getDashboardBySlug` reads `_entries.get(slug)?.config`; the map is updated by `addDashboard` before the function returns. Persistence reload test (`persists added dashboards through a localStorage-backed reload`) verifies the correct config is returned across module reloads.                  |

## Test Coverage Evaluation

| Test Category | Status         | Notes                                                                                                                                             |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001) | Present        | `src/shared/utils/slug.spec.ts:7` — `generateUniqueSlug('my-name', () => false)` → `'my-name'`                                                    |
| Unit (UT-002) | Present        | `src/shared/utils/slug.spec.ts:11` — `generateUniqueSlug('my-name', (s) => s === 'my-name')` → `'my-name-2'`                                      |
| Unit (UT-003) | Present        | `src/shared/utils/slug.spec.ts:15` — `generateUniqueSlug('my-name', (s) => ['my-name', 'my-name-2'].includes(s))` → `'my-name-3'`                 |
| Unit (UT-004) | Present        | `src/features/dashboard/data/dashboard-registry.spec.ts:105–111` — calls `addDashboard`, then asserts `getDashboards()` contains the new entry    |
| Unit (UT-005) | Present        | `src/features/dashboard/data/dashboard-registry.spec.ts:113–120` — calls `deleteDashboard`, then asserts `getDashboardBySlug` returns `undefined` |
| Integration   | Not applicable | Issue states: pure functions; no cross-boundary interactions.                                                                                     |
| Smoke         | Not applicable | Issue states: no build or startup path changes.                                                                                                   |
| E2E           | Not applicable | Issue states: no user-visible behaviour changes.                                                                                                  |
| Regression    | Not applicable | Issue states: no known previous defects in slug generation or dashboard state.                                                                    |
| Performance   | Not applicable | Issue states: O(1) or O(N) operations on small in-memory collections.                                                                             |
| Security      | Not applicable | Issue states: no authentication, authorization, or input handling changes.                                                                        |
| Usability     | Not applicable | Issue states: no user-visible changes.                                                                                                            |
| Observability | Not applicable | Issue states: no new telemetry.                                                                                                                   |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 explicitly states "No new observability requirements").

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-001` — Suggestion — `dashboard-list.stories.ts:53` still documents `dashboardList` by name in a Storybook description string. Not a code dependency; a minor doc update would keep the story accurate.
- `F-002` — Suggestion — Name-to-slug normalization is inline in two registries. Could be a follow-up task to extract a shared `nameToSlug` utility and reuse `titleToSlug` across the feature boundary, but this is out of scope for the current task.
- `F-003` — Suggestion — Three separate `getDashboards()` calls in the component render path create three Map spreads per cycle. Acceptable today; revisit if the dashboard count grows large.

## Unresolved Assumptions or Follow-Up

- The dashboard slug collision suffix changed from `-1` to `-2` as part of this task (the old dashboard loop incremented from 1; the shared function starts at 2). This was intentional and documented in the implementation summary. The spec expectation was updated accordingly (`executive-overview-1` → `executive-overview-2`). This is consistent with NFR-002's stated goal of `-2`, `-3` suffixes across all registries, but callers that relied on the old `-1` suffix pattern in stored slugs (e.g., persisted localStorage data from pre-task dashboards) would not be affected at runtime — the Map is keyed by slug as stored, so loaded slugs remain intact regardless of naming convention. No migration is needed.
- None of the other pre-existing knip findings (`http-error.ts`, `ClientServerContainer`) were introduced by this task; confirmed by stash/restore comparison.
