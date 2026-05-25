# Fix dashboard datasource loading race condition and missing `dataSourceSlugs`

## Bug 1: Race condition in `_loadDatasources`

`_loadDatasources()` was called fire-and-forget in `connectedCallback`. The async `getCatalogService().listDatasources.execute()` hadn't resolved by the time `_ensureViewsCreated` read `_resolvedDataSources`, resulting in `datasourceCount: 0` and no DuckDB views created.

**Fix:** Cache the async promise via `_loadDatasourcesPromise` and `await` it in `_ensureViewsCreated` before reading `_resolvedDataSources`. Reset `_viewsCreated = false` on successful load so a late-arriving load can retry.

## Bug 2: `dataSourceSlugs` lost in Dashboard entity round-trip

The `Dashboard` entity (`core/entities/dashboard.ts`) had no `dataSourceSlugs` field. When a seed dashboard was loaded, `SeededDashboardRepository` → `dashboardConfigToEntity()` dropped the field, and `dashboardEntityToConfig()` started from `createEmptyDashboardConfig()` which sets `dataSourceSlugs: []`. The result: the dashboard always received an empty slug list, so `_resolvedDataSources` returned nothing regardless of race condition.

**Fix:** Add `dataSourceSlugs?: string[]` to the `Dashboard` entity interface and map it through both conversion functions.

## Files changed

| File                                                                   | Change                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts` | Cache `_loadDatasourcesPromise`; await it in `_ensureViewsCreated`; reset `_viewsCreated` on success |
| `src/core/entities/dashboard.ts`                                       | Add `dataSourceSlugs?: string[]` to `Dashboard` interface                                            |
| `src/features/catalog/data/seeded-catalog-repositories.ts`             | Map `config.dataSourceSlugs` → entity in `dashboardConfigToEntity`                                   |
| `src/features/dashboard/model/dashboard-entity-mapper.ts`              | Map entity `dataSourceSlugs` → config in `dashboardEntityToConfig`                                   |

## Tests added

| Test                                                                                    | File                                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `REG-001: awaits _loadDatasources before creating views resolving from catalog service` | `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts` |

## Validations run

- TypeScript typecheck: passed
- ESLint: passed
- Unit tests: 734 passed (53 files)
- Component tests: 145 passed (16 files) including new REG-001
- Playwright end-to-end browser validation: **0 errors** on dashboard view with live data

## Not applicable

- Integration tests: no persistence boundary changed
- E2E tests: the fix alters component behavior verified at component + browser validation level
- Observability: no new logging/metrics needed
- ADRs: routine bug fix, no architectural assumption changed
- Accessibility: no UI changes
