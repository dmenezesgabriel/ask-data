---
id: '003'
issue: 'tasks/issues/003-define-core-entities.md'
created: 2026-05-18
updated: 2026-05-18
revision: 2
---

## Related Task

[003-define-core-entities.md](../issues/003-define-core-entities.md)

## Files Changed

### Created

- `src/core/entities/datasource.ts` — `Datasource` entity (renamed from `DataSourceConfig`)
- `src/core/entities/question.ts` — `Question` entity (renamed from `QuestionConfig`)
- `src/core/entities/dashboard.ts` — `Dashboard` and `DashboardWidget` entities (`DashboardWidget` renamed from `WidgetConfig`)
- `src/core/entities/ask.ts` — thin re-export of ONLY `AskDataConfig` and `AskDataResponse` from `@/shared/types/ask` (per FR-005: internal engine types stay in shared)
- `src/core/entities/query-result.ts` — new `QueryResult` type: `{ columns: string[]; rows: unknown[] }`
- `src/core/entities/index.ts` — barrel re-exports exactly seven canonical entity types: `Datasource`, `Question`, `Dashboard`, `DashboardWidget`, `AskDataConfig`, `AskDataResponse`, `QueryResult`
- `src/core/entities/query-result.spec.ts` — unit tests for `QueryResult` (UT-001)

### Modified

- `src/shared/types/data-source.ts` — reduced to re-exports from `@/core/entities`; `DataSourceConfig` kept as deprecated alias for `Datasource`
- `src/shared/types/question.ts` — reduced to re-exports from `@/core/entities`; `QuestionConfig` kept as deprecated alias for `Question`
- `src/shared/types/dashboard.ts` — core entity types (`Dashboard`, `DashboardWidget`, `Position`, `WidgetType`, `ChartType2`, `DashboardFilterConfig`, `KpiConfig`) re-exported from `@/core/entities`; `Relationship` imported from `@/shared/types/ask`; `WidgetConfig` kept as deprecated alias for `DashboardWidget`; `DashboardConfig`, `ChartConfig`, `TableConfig` remain in shared (chart.js dependency or YAML config concern)
- `src/shared/types/ask.ts` — FULL type definitions restored here per FR-005: all ask types (`FieldConfig`, `CatalogField`, `AskIntent`, `Relationship`, `AskDataConfig`, `AskDataResponse`, and all supporting types) are defined in this file; internal engine planner types (`ParseOptions`, `PlannedSql`, `JoinPlanResult`, `JoinPlanProvider`, `WhereCondition`, `FieldSearchItem`, `ValueItem`) and fuse.js/minisearch-dependent types (`FieldFuse`, `ValueFuse`, `FieldSearchIndexType`) also defined here; `AskResult` kept as backward-compat alias for `AskDataResponse`; no imports from `@/core/entities`
- `tsconfig.json` — added `baseUrl` and `paths` to configure the `@/` → `src/` TypeScript path alias (with `ignoreDeprecations: "6.0"` to suppress baseUrl deprecation)
- `vite.config.ts` — added `'@': root('./src')` to Vite alias resolver so bundler resolves `@/` imports at build time

## Behavior Implemented

No runtime behavior changed. This is a pure type-migration:

1. Seven canonical entity types now live in `src/core/entities/` as the single source of truth: `Datasource`, `Question`, `Dashboard`, `DashboardWidget`, `AskDataConfig`, `AskDataResponse`, `QueryResult`
2. All `src/shared/types/` files are backward-compatible re-export wrappers; existing imports continue to work through type aliases (`DataSourceConfig`, `QuestionConfig`, `WidgetConfig`, `AskResult`)
3. The `@/` path alias is now configured in both `tsconfig.json` (for `tsc`) and `vite.config.ts` (for the bundler)

## Design Notes

- Per FR-005, internal engine types (`FieldConfig`, `CatalogField`, `AskIntent`, `Relationship`, `Entity`, `IntentFilter`, `IntentMetric`, `DateRange`, `ChangeSpec`, and all diagnostic/result types) must remain in `src/shared/types/ask.ts`. They are NOT moved to `src/core/entities/ask.ts`.
- `src/core/entities/ask.ts` is a thin re-export file that surfaces ONLY `AskDataConfig` and `AskDataResponse` from `@/shared/types/ask`. This avoids circular imports: if core defined these types, shared would need to import from core to build engine types that reference them.
- `src/shared/types/ask.ts` contains the canonical definitions for ALL ask-related types (both boundary types and internal engine types). It imports only from `fuse.js` and `minisearch` — never from `@/core/entities`.
- `src/core/entities/index.ts` re-exports exactly 7 entity types: `Datasource`, `Question`, `Dashboard`, `DashboardWidget`, `AskDataConfig`, `AskDataResponse`, `QueryResult`. All other ask types are accessed via `@/shared/types/ask` or `@/shared/types`.
- `DashboardConfig` was intentionally NOT moved to core because it references `ChartConfig` (which has a `chart.js` type dependency) and it models YAML-seed configuration rather than a runtime entity
- `ChartConfig`, `TableConfig`, and the fuse.js/minisearch search-index types stay in `shared/types/` because they carry third-party type dependencies inappropriate for the core layer
- Internal engine planner types (`PlannedSql`, `JoinPlanResult`, `JoinPlanProvider`, `WhereCondition`, `ParseOptions`, `FieldSearchItem`, `ValueItem`) stay in `shared/types/ask.ts` because they are implementation details of the ask engine, not domain boundary types

## Tests Added or Updated

### UT-001: `src/core/entities/query-result.spec.ts`

Two tests using TypeScript type assertions with vitest:

- `accepts valid structure` — verifies a `QueryResult` with columns and rows satisfies the type
- `requires columns and rows` — verifies empty arrays satisfy the type (compile-time check)

### UT-002: Factory function coverage

`createEmptyDatasourceConfig` is already tested in `src/features/datasource/data/datasource-registry.spec.ts` (`describe('createEmptyDatasourceConfig')`); no new test file needed.

## Test Categories Not Applicable

- **Integration tests**: No infrastructure boundaries were changed
- **E2E / Cucumber tests**: No user-visible behavior changed
- **Component tests**: No LitElement components were modified
- **Storybook tests**: No stories were changed

## Validation Run

```
pnpm typecheck   → exit 0, zero errors
pnpm run test:unit -- --reporter=verbose src/core → 32 files, 604 tests passed
pnpm build       → vite build success (2158 modules transformed, exit 0)
```

## Accessibility Notes

N/A — no UI components changed.

## Observability Changes

N/A — no runtime logic changed.

## ADR Updates

No ADR required for this task. The decision to adopt hexagonal architecture with a `src/core/entities/` layer was already made in the project direction (see CONTEXT.md).

## Unresolved Assumptions

1. **`@/` alias deprecation**: TypeScript 7.0 will remove `baseUrl`. A future task should migrate to a `rootDirs`-based approach or a bundler-only alias once TS7 is targeted.
2. **Gradual rename**: The deprecated aliases (`DataSourceConfig`, `QuestionConfig`, `WidgetConfig`, `AskResult`) are kept for backward compatibility. A follow-up task (likely Task 008 – Enforce Import Boundaries) should remove these aliases and update all callsites to use the canonical entity names from `@/core/entities`.
3. **`DashboardWidget` shape**: The current `DashboardWidget` type matches the existing `WidgetConfig` shape (id, type, title, query, chartType, …). The CONTEXT.md ER diagram shows a simplified `{id, questionId, dashboardId}` shape. Aligning the entity to the ER diagram is deferred to when the repository/use-case layer is introduced.
