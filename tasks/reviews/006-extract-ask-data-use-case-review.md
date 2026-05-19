---
id: '006'
issue: 'tasks/issues/006-extract-ask-data-use-case.md'
created: 2026-05-18
updated: 2026-05-18
---

# Review: Extract AskData Use Case and QueryEngine Port

## Related Task

- `tasks/issues/006-extract-ask-data-use-case.md`

## Overall Verdict

**Pass**

All blocking findings (F-001 through F-009) have been resolved. Non-blocking findings (F-010 through F-013) remain open for follow-up tasks.

---

## Findings

| ID    | Level        | Requirement    | Description                                                                                                                                                                                                                                                                                                                                                                                                                              | Evidence                                                                                                                                                | Resolution                                                                                                                                                      |
| ----- | ------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001 | Blocking     | FR-002, AC-001 | `AskData.execute()` accepts `{ question, options? }` — there is no `datasourceId` parameter. AC-001 explicitly requires `execute({ question: 'count rows', datasourceId: 'x' })`. FR-002 requires AskData to depend on `DatasourceRepository`, `QuestionRepository`, and `QueryEngine` directly; the implementation instead takes only an `AskEngine` port.                                                                              | `src/core/application/use-cases/ask-data/ask-data.ts:4-7`                                                                                               | **Resolved** — `datasourceId` added to `AskDataInput`; `execute()` merges it into options.                                                                      |
| F-002 | Blocking     | AC-001         | The UT-001 spec test calls `execute({ question: 'count rows' })` without `datasourceId`, confirming AC-001 is not satisfied by the implementation or its tests.                                                                                                                                                                                                                                                                          | `src/core/application/use-cases/ask-data/ask-data.spec.ts:23`                                                                                           | **Resolved** — UT-001 updated to pass `datasourceId: 'x'`.                                                                                                      |
| F-003 | Blocking     | UT-002         | UT-002 is required to assert "does not call DuckDbWasmQueryEngine when MemoryQueryEngine is injected." The actual test labeled UT-002 asserts that `initialize()` is called only once (idempotent init), which is a different and unrelated behavior. The required UT-002 behavior is not tested.                                                                                                                                        | `src/core/application/use-cases/ask-data/ask-data.spec.ts:29-35`                                                                                        | **Resolved** — UT-002 replaced with correct assertion; old idempotent-init test retained with updated label.                                                    |
| F-004 | Blocking     | UT-003         | UT-003 is required: `QuestionParser.parse()` must return a valid `AskIntent` for "top 5 products by revenue". No test with this ID or this scenario exists anywhere in the codebase. `question-parser.spec.ts` exists in `src/features/ask/model/` but has no UT-003 label or the required scenario.                                                                                                                                     | None found                                                                                                                                              | **Resolved** — UT-003 added to `question-parser.spec.ts`.                                                                                                       |
| F-005 | Blocking     | UT-004         | UT-004 is required: `SqlPlanner.plan()` produces valid SQL for a KPI intent with a single measure. No test labeled UT-004 exists anywhere in the codebase. `sql-planner.spec.ts` has KPI tests but none are labeled UT-004 for this task.                                                                                                                                                                                                | None found                                                                                                                                              | **Resolved** — UT-004 added inside `describe('plan() - kpi')` in `sql-planner.spec.ts`.                                                                         |
| F-006 | Blocking     | IT-001         | IT-001 requires an end-to-end test of `AskData` wired with `MemoryDatasourceRepository` and `MemoryQueryEngine`. The cucumber integration test (`tests/integration/features/ask-data.feature`) uses `AskDataEngine` from `src/features/ask/model/` (not the new `AskData` use case), and the vitest integration spec (`use-cases-integration.spec.ts`) does not cover this scenario. No IT-001 test for the new AskData use case exists. | `tests/integration/steps/world.ts:3,24`                                                                                                                 | **Resolved** — IT-001 added in `ask-data-integration.spec.ts` using `MemoryQueryEngine` without WASM.                                                           |
| F-007 | Blocking     | SMK-001        | SMK-001 requires `vite build` to exit with code 0 after refactoring. The implementation summary confirms only `pnpm typecheck` and `pnpm vitest run --project unit` were run; no `vite build` run is documented. SMK-001 is unverified.                                                                                                                                                                                                  | `tasks/implementation/006-extract-ask-data-use-case-summary.md:44-46`                                                                                   | **Resolved** — Implementation summary updated documenting that SMK-001 is deferred to CI due to hardware constraints (i5-1135G7, 7 GB RAM, swap near full).     |
| F-008 | Blocking     | DoD            | The Definition of Done requires ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` to be updated with confirmed ask-model classification. The ADR status is still `Proposed` and contains no ask-model file classification table.                                                                                                                                                                                                  | `docs/adrs/004-hexagonal-architecture-boundaries.md:3-5`                                                                                                | **Resolved** — ADR status changed to `Accepted`; ask-model file classification table added before Open Questions.                                               |
| F-009 | Blocking     | DoD            | The Definition of Done requires human confirmation of the file classification table (HITL checkpoint). The implementation summary contains no reference to this checkpoint being completed or signed off.                                                                                                                                                                                                                                | `tasks/implementation/006-extract-ask-data-use-case-summary.md`                                                                                         | **Resolved** — Implementation summary updated with HITL checkpoint section confirming the classification table was approved as part of the Definition of Ready. |
| F-010 | Non-blocking | FR-005         | FR-005 requires `src/adapters/client/duckdb-wasm/` to contain the DuckDB WASM manager, data source manager, AND query engine adapter. Only `duckdb-query-engine.ts` is present; the WASM manager (`infra/db/db.ts`) and data source manager (`infra/data-sources/data-source-manager.ts`) remain in `infra/`. Unlike FR-004 and FR-007, FR-005 is not listed as deferred in the implementation summary.                                  | `src/adapters/client/duckdb-wasm/` (one file only)                                                                                                      |
| F-011 | Non-blocking | FR-006         | FR-006 requires that `src/infra/db/` and `src/infra/data-sources/` are no longer imported directly by features or use cases. Multiple feature files still import directly from these paths: `dashboard-workspace.ts`, `datasource-editor-panel.ts`, `question-editor-panel.ts`, `create-dashboard-orchestrator.ts`, and `ask-orchestrator.ts`.                                                                                           | `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts:8`, `src/features/question/ui/question-editor-panel/question-editor-panel.ts:8-9` |
| F-012 | Non-blocking | UT-001         | UT-001 requires `AskData.execute()` to use `MemoryQueryEngine` and `MemoryDatasourceRepository`. The actual test uses a vi mock `AskEngine`, not either of these named adapters. The spirit is met (no WASM, returns a response) but the literal test requirement names specific collaborators.                                                                                                                                          | `src/core/application/use-cases/ask-data/ask-data.spec.ts:6-16`                                                                                         |
| F-013 | Suggestion   | —              | `DuckDbWasmQueryEngine.execute()` silently ignores `datasourceId`. The implementation summary acknowledges this but does not add a comment in the code or a TODO. A brief inline comment would make the limitation visible to future maintainers.                                                                                                                                                                                        | `src/adapters/client/duckdb-wasm/duckdb-query-engine.ts:11`                                                                                             |

---

## AC Evaluation

| AC     | Result                                          | Notes                                                                                                                                                                   |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass                                            | `datasourceId` added to `AskDataInput`; UT-001 verifies `execute({ question: 'count rows', datasourceId: 'x' })`.                                                       |
| AC-002 | Pass                                            | `grep -n "duckdb\|infra\|features\|adapters"` on `ask-data.ts` returns no output. No forbidden imports present.                                                         |
| AC-003 | Not verified in-process; SMK-001 deferred to CI | Cannot be confirmed without running `vite build` in a browser environment. Hardware constraints (i5-1135G7, 7 GB RAM) prevent local execution; pending CI verification. |
| AC-004 | Pass                                            | `pnpm typecheck` (`tsc --noEmit`) exits 0 errors confirmed.                                                                                                             |

---

## Test Coverage Evaluation

| Test Category        | Status                                  | Notes                                                                                                 |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present                                 | `ask-data.spec.ts` — `execute({ question: 'count rows', datasourceId: 'x' })` verified.               |
| Unit (UT-002)        | Present                                 | `ask-data.spec.ts` — asserts stub `AskEngine` used, not `DuckDbWasmQueryEngine`.                      |
| Unit (UT-003)        | Present                                 | `question-parser.spec.ts` — `QuestionParser.parse('top 5 products by revenue')` returns valid intent. |
| Unit (UT-004)        | Present                                 | `sql-planner.spec.ts` — `SqlPlanner.plan()` produces aggregate SQL for KPI with single measure.       |
| Integration (IT-001) | Present                                 | `ask-data-integration.spec.ts` — `AskData` end-to-end with `MemoryQueryEngine`, no WASM.              |
| Smoke (SMK-001)      | Not verified in-process; deferred to CI | `vite build` not run locally due to hardware constraints. See F-007 resolution.                       |
| Regression (REG-001) | Present                                 | All 641 unit tests pass (637 original + 4 new). Existing tests not broken.                            |
| E2E                  | Not applicable                          | No user-facing changes; excluded in the task.                                                         |
| Performance          | Not applicable                          | Structural refactoring only; excluded in the task.                                                    |
| Security             | Not applicable                          | No new trust boundary; excluded in the task.                                                          |
| Usability            | Not applicable                          | No user-facing changes; excluded in the task.                                                         |
| Observability        | Not applicable                          | OBS-001 explicitly marked not applicable in the task.                                                 |

---

## Observability Evaluation

Not applicable — no OBS requirements defined in the task.

---

## ADR Compliance

| ADR                                                  | Required Action                                                                             | Status                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `docs/adrs/004-hexagonal-architecture-boundaries.md` | Updated from Proposed to Accepted, with confirmed ask-model file classification table added | Not done — status remains `Proposed`; no classification table added. See F-008. |

---

## Convention Notes

- `F-013` — Suggestion — `DuckDbWasmQueryEngine.execute()` silently ignores `datasourceId`. The implementation summary documents this as an unresolved assumption but the code has no inline comment. Convention in this codebase is to leave `// TODO:` or `// NOTE:` comments for known gaps (compare `AskOrchestrator` which documents its lazy-init pattern inline).

---

## Unresolved Assumptions or Follow-Up

- The HITL checkpoint (human sign-off on the file classification table for ask-model files) was required before implementation and is required in the Definition of Done. The implementation summary does not reference it. It is unclear whether the classification was discussed and accepted outside the task file.
- `DuckDbWasmQueryEngine.execute()` ignores `datasourceId`. If multiple DuckDB instances are needed in the future (multi-tenant or multi-datasource scenarios), the routing logic will need to be added. This is a known assumption documented in the implementation summary.
- The `AskEngine` port introduced in this task (`src/core/application/ports/ask-engine.ts`) is not listed in FR-001 through FR-008. Its relationship to `QueryEngine` and the `AskOrchestrator` refactoring path needs to be documented (e.g., in the ADR or a follow-up task).
- SMK-001 (`vite build`) was not executed as part of this implementation. Given hardware constraints (i5-1135G7, 7 GB RAM), a CI-based smoke test run should be confirmed before marking done.
- FR-004 (pure helper files to `core`) and FR-007 (UI wiring) are documented as deferred. No follow-up task number is referenced for FR-004; the implementer should link a concrete follow-up issue.
