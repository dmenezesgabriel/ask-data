---
id: '013'
issue: 'tasks/issues/013-fix-critical-bugs.md'
created: 2026-05-21
updated: 2026-05-21
resolved: 2026-05-21
---

# Review: Fix critical bugs — SQL planner typo, localStorage exception, non-unique Datasource IDs

## Related Task

- `tasks/issues/013-fix-critical-bugs.md`

## Overall Verdict

**Pass**

No Blocking findings. One Non-blocking finding for an out-of-scope change in `sql-planner.ts`. All three production fixes are correct and verified by tests.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                           | Evidence                                    |
| ----- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| F-001 | Non-blocking | DoD         | `sql-planner.ts` had a fourth change beyond the three required locations: `findRelationshipPath` gained a return-type annotation — **Resolved**: documented in implementation summary | `src/features/ask/model/sql-planner.ts:432` |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                          |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001 | Pass   | `planGrouped()` line 317: `CAST(d${i + 1} AS VARCHAR)` — closing `)` confirmed in diff. UT-001 asserts `result.sql` contains `CAST(d1 AS VARCHAR)` and `CAST(d2 AS VARCHAR)`.  |
| AC-002 | Pass   | `persistQuestions()` now wraps `setItem` in try/catch. UT-002 stubs `setItem` to throw `DOMException('QuotaExceededError')` and asserts `addQuestion()` does not propagate it. |
| AC-003 | Pass   | `addDatasource()` uses `crypto.randomUUID()`. UT-003 calls it twice synchronously and asserts distinct IDs matching `^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$` UUID pattern. |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                               |
| -------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present        | `src/features/ask/model/sql-planner.spec.ts` — two-dimension ranking plan, asserts valid CAST expressions, `result.error` undefined |
| Unit (UT-002)        | Present        | `src/features/question/data/question-registry.spec.ts` — QuotaExceededError swallow via `addQuestion()`                             |
| Unit (UT-003)        | Present        | `src/features/datasource/data/datasource-registry.spec.ts` — two synchronous `addDatasource()` calls, distinct UUID format          |
| Regression (REG-001) | Present        | Covered by UT-001: `result.error` is `undefined` and SQL contains valid CAST syntax for two dimensions                              |
| Integration          | Not applicable | Task specifies: isolated pure functions with no cross-boundary interactions                                                         |
| Smoke                | Not applicable | Task specifies: no impact on application startup or page load                                                                       |
| E2E                  | Not applicable | Task specifies: fixes restore already-intended behaviour, no complete user journey change                                           |
| Performance          | Not applicable | Task specifies: none of the three fixes affect runtime performance                                                                  |
| Security             | Not applicable | Task specifies: no auth, authorization, input handling, secrets, or trust boundaries touched                                        |
| Usability            | Not applicable | Task specifies: changes are internal; no user-visible states change                                                                 |
| Observability        | Not applicable | Task specifies: OBS-001 — no new observability requirements                                                                         |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task.

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-001` — Non-blocking — The diff includes a return-type annotation (`Relationship[] | null`) added to `findRelationshipPath()` in `sql-planner.ts`. This change was not mentioned in the implementation summary and falls outside the DoD's "exactly three locations" constraint. It is a net-positive TypeScript improvement (eliminates an implicit return type), causes no behavioral change, and all tests pass. Recommend the implementer document such incidental improvements in the implementation summary to avoid confusion during review.

- `persistDatasources()` (the reference implementation for FR-002) does not wrap its own `setItem` in try/catch — the bug fix aligns `persistQuestions()` with `loadPersistedQuestions()` which already had a try/catch pattern, consistent with the intent described in the task.

- NFR-002 verified: no production code and no test outside `datasource-registry.spec.ts` itself matches on the `datasource-${...}` ID prefix. The existing test `'addDatasource generates id and timestamps'` checks only `ds.id` truthiness, not format. No breakage from the UUID format change.

## Unresolved Assumptions or Follow-Up

- `persistDatasources()` follow-up — **Resolved**: try/catch added to `datasource-registry.ts:persistDatasources()` and a matching QuotaExceededError swallow test added to `datasource-registry.spec.ts`.
- REG-001 is satisfied at the SQL generation layer (no DuckDB parse error in the planned SQL). An integration-level smoke test that executes the SQL against a real DuckDB WASM instance with two dimensions has not been added, but the task explicitly marks integration tests as not applicable.
