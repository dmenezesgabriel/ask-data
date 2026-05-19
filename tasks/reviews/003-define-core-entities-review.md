---
id: '003'
issue: 'tasks/issues/003-define-core-entities.md'
created: 2026-05-18
updated: 2026-05-18
revision: 2
---

# Review: Define Core Entities

## Related Task

- `tasks/issues/003-define-core-entities.md`

## Overall Verdict

**Pass** — F-001 resolved in revision 2. All blocking findings cleared.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                                                                                                      | Evidence                                                                                                                                                                     |
| ----- | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001 | **Resolved** | FR-005      | Internal ask engine types (`FieldConfig`, `CatalogField`, `AskIntent`, `Relationship`, and their dependents) were moved back to `src/shared/types/ask.ts` per FR-005. `src/core/entities/ask.ts` is now a thin re-export of only `AskDataConfig` and `AskDataResponse`. `src/shared/types/ask.ts` has no imports from `@/core/entities`. Resolved in revision 2. | `src/core/entities/ask.ts` — 7 lines, re-exports only `AskDataConfig` and `AskDataResponse`. `src/shared/types/ask.ts` — ~385 lines, all type definitions, no core imports.  |
| F-002 | Non-blocking | FR-004      | Deprecated backward-compat aliases (`DataSourceConfig`, `QuestionConfig`, `WidgetConfig`, `AskResult`) remain in `src/shared/types/` files with no accompanying follow-up task or ticket reference to ensure they are removed. The summary mentions "Task 008" as the expected cleanup point, but no formal link exists.                                         | `src/shared/types/data-source.ts`, `src/shared/types/question.ts`, `src/shared/types/dashboard.ts`, `src/shared/types/ask.ts` — each contains at least one deprecated alias. |
| F-003 | Suggestion   | —           | Now moot. `src/core/entities/ask.ts` is a 7-line thin re-export; no concern about size.                                                                                                                                                                                                                                                                          | `src/core/entities/ask.ts` — 7 lines.                                                                                                                                        |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001 | Pass   | `src/core/entities/datasource.ts` exists, contains the `Datasource` interface, and grep finds zero forbidden imports (`localStorage`, `fetch`, `LitElement`, `duckdb`, `yaml`, DOM APIs).                                            |
| AC-002 | Pass   | `src/core/entities/index.ts` re-exports all seven required entity types: `Datasource`, `Question`, `Dashboard`, `DashboardWidget`, `AskDataConfig`, `AskDataResponse`, `QueryResult`. Additional supporting types are also exported. |
| AC-003 | Pass   | `pnpm typecheck` exits with zero errors.                                                                                                                                                                                             |
| AC-004 | Pass   | Grep finds no imports from `features`, `adapters`, `infra`, or `shared/ui` in any `src/core/entities/*.ts` file.                                                                                                                     |

## Test Coverage Evaluation

| Test Category   | Status         | Notes                                                                                                                                                                                    |
| --------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit — UT-001   | Present        | `src/core/entities/query-result.spec.ts` — two tests: `accepts valid structure` and `requires columns and rows`. Both assert `columns` and `rows` are defined and correct.               |
| Unit — UT-002   | Present        | `createEmptyDatasourceConfig` factory is tested in `src/features/datasource/data/datasource-registry.spec.ts` (pre-existing). No new test added because the factory was already covered. |
| Smoke — SMK-001 | Present        | `pnpm build` exits code 0; 2158 modules transformed.                                                                                                                                     |
| Integration     | Not applicable | No runtime boundaries crossed — type migration only.                                                                                                                                     |
| E2E             | Not applicable | No user-visible behavior changes.                                                                                                                                                        |
| Regression      | Not applicable | No known previous defect in this area.                                                                                                                                                   |
| Performance     | Not applicable | Type moves have no runtime performance impact.                                                                                                                                           |
| Security        | Not applicable | No trust boundary or input handling changes.                                                                                                                                             |
| Usability       | Not applicable | No user-facing changes.                                                                                                                                                                  |
| Observability   | Not applicable | OBS-001 is marked not applicable in the task.                                                                                                                                            |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 explicitly marked not applicable).

## ADR Compliance

| ADR                                                  | Required Action                                     | Status                              |
| ---------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `docs/adrs/004-hexagonal-architecture-boundaries.md` | Remains linked (DoD does not require status update) | Done — file exists and is Proposed. |

## Convention Notes

- **F-002** — Non-blocking — Deprecated aliases in `src/shared/types/` are a sound migration pattern, but the removal plan ("Task 008") is only mentioned in the implementation summary, not formally tracked. Adding a `// TODO(task-008): remove deprecated alias` comment at each alias site would make the intent visible in code review.
- **F-003** — Suggestion — `src/core/entities/ask.ts` bundles two boundary types with ~200 lines of transitive dependencies. Not a violation, but worth revisiting when the ask use case (Task 006) is implemented.

## Unresolved Assumptions or Follow-Up

1. **F-001**: Resolved in revision 2. Internal engine types restored to `src/shared/types/ask.ts`; `src/core/entities/ask.ts` is a thin re-export of only the two boundary types.
2. **`@/` alias deprecation**: `tsconfig.json` uses `ignoreDeprecations: "6.0"` to suppress the `baseUrl` deprecation. This is acceptable short-term but should be tracked for TypeScript 7 migration.
3. **`DashboardWidget` shape mismatch**: The entity in `src/core/entities/dashboard.ts` retains the full `WidgetConfig` shape (id, type, title, query, chartType, …) rather than the simplified `{ id, questionId, dashboardId }` from CONTEXT.md. Deferred to Task 004/005, as noted in the implementation summary.
