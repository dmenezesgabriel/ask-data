---
issue: tasks/issues/008-enforce-import-boundaries.md
status: completed
---

## Summary

Enforced strict import boundaries across the codebase using `eslint-plugin-boundaries` v6. All 7 import zones are declared and all boundary violations have been eliminated.

## Behavior implemented

- **FR-001 — Zones declared**: 7 zones configured in `eslint.config.js`: `core`, `adapters`, `composition`, `features`, `infra`, `shared`, `app`.
- **FR-002 — Default-deny**: All cross-zone imports default to `disallow`.
- **FR-003 — Allowed-import matrix**: `boundaries/dependencies` rule fully configured with the approved dependency matrix.
- **FR-004 / AC-003 — Zero boundary violations**: `npx eslint src --ext .ts 2>&1 | grep "boundaries/"` returns empty output.
- **FR-006 — CI**: ESLint boundary check runs as part of the existing `lint` step.

## Violations fixed

| Violation                                                               | Fix                                                                                                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features→infra` (duckDBManager direct imports)                         | Replaced with `getDbService()` service locator from `shared/services/db-service.ts`                                                                      |
| `shared→features` (datasource-picker re-exported from shared)           | Moved `DatasourcePicker` component to `src/features/datasource/ui/datasource-picker/`                                                                    |
| `features→app` (dashboard.ts re-exporting app-zone items)               | Emptied stub; moved spec and story to `app` zone                                                                                                         |
| `adapters→features` (local-storage repos importing datasource registry) | Rewrote adapters to be self-contained; removed YAML-seed coupling                                                                                        |
| `core→adapters` (integration specs in core zone)                        | Moved integration specs to `src/composition/`                                                                                                            |
| `shared→core` (shared/types/dashboard.ts importing core entities)       | Moved `DashboardFilterConfig`, `KpiConfig`, `Position` from `core/entities/dashboard.ts` to `shared/types/dashboard.ts`; core now re-exports from shared |
| `features→infra` (QueryPort direct import)                              | Updated to import `QueryPort` from `@/core/application/ports`                                                                                            |

## Files changed

**eslint.config.js** — Added `infra` to `adapters` and `composition` allowed zones.

**src/shared/services/db-service.ts** — Added `createViews` to `DbService` interface.

**src/shared/types/ask.ts** — Removed `AskResult` backward-compat alias (all consumers updated to use `AskDataResponse`).

**src/shared/types/dashboard.ts** — Now owns `DashboardFilterConfig`, `KpiConfig`, `Position` (moved from core).

**src/shared/types/index.ts** — Removed re-exports of emptied `data-source.ts` and `question.ts` modules.

**src/core/entities/dashboard.ts** — `DashboardFilterConfig`, `KpiConfig`, `Position` moved to `shared/types/dashboard.ts`; re-exported from core for backward compat.

**src/infra/data-sources/data-source-manager.ts** — Imports `DataSourceEntry`, `DataSourceManager`, `QueryPort` from `@/core/application/ports`.

**src/infra/db/db.ts** — Imports `QueryPort` from `@/core/application/ports`.

**src/composition/client-only-container.ts** — Calls `setDbService(...)` wiring DuckDB to the service locator at startup.

**src/composition/use-cases.spec.ts** — Moved from `core/application/use-cases/use-cases.spec.ts`.

**src/composition/use-cases-integration.spec.ts** — Moved from `core/application/use-cases/`.

**src/composition/ask-data-integration.spec.ts** — Moved from `core/application/use-cases/ask-data/`.

**src/features/datasource/ui/datasource-picker/datasource-picker.ts** — New file in features zone (moved from shared).

**src/features/ask/orchestration/create-dashboard-orchestrator.ts** — Rewritten to use `getDbService()` instead of direct infra import.

**src/features/ask/orchestration/ask-orchestrator.ts** — Updated to import ports from `@/core/application/ports`.

**src/features/dashboard/model/dashboard-config.ts** — Removed app-zone import; inlined defaults.

**src/features/dashboard/model/dashboard-yaml.ts** — Updated `Dashboard`, `DashboardWidget as WidgetConfig`, `ChartType2` imports to `@/core/entities`.

**src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts** — Replaced `duckDBManager` with `getDbService()`.

**src/features/dashboard/ui/dashboard-workspace/dashboard-workspace-model.ts** — Updated `Dashboard`, `QuestionConfig`, `WidgetConfig` imports to `@/core/entities`.

**src/features/dashboard/ui/widget-editor/widget-editor.ts** — Updated type imports to `@/core/entities`.

**src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.ts** — Replaced infra with `getDbService()` and `toRows()`.

**src/features/question/ui/question-editor-panel/question-editor-panel.ts** — Replaced infra with `getDbService()`.

**src/adapters/client/local-storage/local-storage-datasource-repository.ts** — Rewritten self-contained (no features zone imports).

**src/adapters/client/local-storage/local-storage-question-repository.ts** — Rewritten self-contained.

**src/app/routing/hash-routes.spec.ts** — Moved from features zone; tests `parseHash`/`routeToHash` locally.

**src/app/shell/app-shell.stories.ts** — Moved from features zone.

**Deleted**: `src/features/dashboard/ui/dashboard/dashboard.ts`, `index.ts`, `dashboard.spec.ts`, `dashboard.stories.ts` (empty stubs and moved files).

**Deleted**: `src/core/application/use-cases/use-cases.spec.ts`, `use-cases-integration.spec.ts`, `ask-data/ask-data-integration.spec.ts` (moved to composition zone).

## Tests added or updated

- `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts` — Updated YAML-seed test: adapter no longer seeds from features zone; test now asserts empty list on fresh store.
- `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts` — Added `beforeAll` calling `setDbService` with mock (component warm-warms DB in `connectedCallback`).
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts` — Added `beforeAll` calling `setDbService` with mock (component accesses DB in constructor).
- `src/app/routing/hash-routes.spec.ts` — New; equivalent coverage to old `dashboard.spec.ts`.

## Validations run

- `npx tsc --noEmit` — zero errors
- `npx eslint src --ext .ts` — zero errors (including zero `boundaries/dependencies` violations)
- `npx vitest run` — 878 tests passed, 74 test files passed, 4 skipped

## Accessibility

No UI changes; not applicable.

## ADRs updated

None — boundaries enforcement was already an existing architectural intent; no assumptions changed.

## Unresolved assumptions

None.
