---
id: '011'
issue: 'tasks/issues/011-ask-model-quality-types-heuristics-algorithm.md'
created: 2026-05-20
updated: 2026-05-20
---

# Review: Ask Model Quality — Types, Heuristics, Algorithm

## Related Task

- `tasks/issues/011-ask-model-quality-types-heuristics-algorithm.md`

## Overall Verdict

**Fail**

Blocked by F-001, F-002. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID    | Level        | Requirement      | Description                                                                                                                                                                                                                                              | Evidence                                                                                              |
| ----- | ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| F-001 | Blocking     | IT-001, DoD      | IT-001 is absent. No Cucumber scenario verifies that a catalog containing a `profit` measure field returns rows (not an `unsupportedMetric` error).                                                                                                      | `tests/integration/features/ask-data.feature` — no profit-measure passing scenario                    |
| F-002 | Blocking     | FR-001, DoD      | `QuestionParser.withOriginalQuestion(result, question: string)` — `result` has no type. This is an implicit-any parameter in a public method, directly violating FR-001 and the DoD. Enabling `noImplicitAny` in Task 012 will fail here.                | `src/features/ask/model/question-parser.ts:357`                                                       |
| F-003 | Non-blocking | FR-001           | `SqlPlanner.findRelationshipPath()` and `CatalogBuilder.build()` are missing explicit return type annotations. FR-001 requires "explicit… return types" on all public methods. (Parameters are typed; DoD's narrower "explicit parameter types" is met.) | `src/features/ask/model/sql-planner.ts:435`, `src/features/ask/model/catalog-builder.ts:83`           |
| F-004 | Non-blocking | PT-001, DoD      | PT-001 as specified requires calling `findMatches()` 100 times with 10-word queries. The actual test calls `resolve()` once. The 50 ms budget is asserted, but `resolve()` is a superset of `findMatches()` and the iteration count is not validated.    | `src/features/ask/model/value-filter-resolver.spec.ts:574`                                            |
| F-005 | Non-blocking | REG-001, NFR-003 | The existing integration scenario ("lucro por região") covers the principle but not the specific "earnings" scenario cited in REG-001. No test confirms a "truly unsupported" English-term query produces a metric-listing error.                        | `tests/integration/features/ask-data.feature` — Unsupported metric scenario uses Portuguese term only |
| F-006 | Suggestion   | UT-004           | UT-004 was labelled as testing `findMatches()` and asserting absence of the O(N²) source pattern. The test calls `resolve()` instead and omits the static source assertion. Behavioural coverage is adequate; label and scope should be corrected.       | `src/features/ask/model/value-filter-resolver.spec.ts:573`                                            |
| F-007 | Suggestion   | UT-005           | The issue requirement example uses column name `amount`; the test uses column `Qty`. Behaviour is correct and the assertion is valid, but the column name diverges from the stated example in UT-005.                                                    | `src/features/ask/model/sql-renderer.spec.ts:14`                                                      |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                    |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `detectUnsupportedMetric` returns `null` when catalog has a matching measure; verified by UT-001 in `question-parser.spec.ts:125`                        |
| AC-002 | Pass   | `detectUnsupportedMetric` returns term when absent; verified by UT-002 in `question-parser.spec.ts:136`                                                  |
| AC-003 | Pass   | `measurePriority` returns `1000 + priority` (e.g. `1005`) for `priority: 5`, beating "sales" score of `100`; verified by UT-003 in `ask-data.spec.ts:31` |
| AC-004 | Pass   | `resolve()` with 500-item catalog completes in under 50 ms; Set-based exact-dup guard in place; verified in `value-filter-resolver.spec.ts:574`          |
| AC-005 | Pass   | `renderCondition` with `fieldType: 'INTEGER'` renders `t0."Qty" = 42` (unquoted); verified by UT-005 in `sql-renderer.spec.ts:14`                        |
| AC-006 | Pass   | `renderCondition` with `fieldType: 'VARCHAR'` renders `t0."Region" = 'East'` (quoted); verified by UT-006 in `sql-renderer.spec.ts:27`                   |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                                                    |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001–UT-006) | Present        | All six unit tests present and correctly named in `question-parser.spec.ts`, `ask-data.spec.ts`, `sql-renderer.spec.ts`, `value-filter-resolver.spec.ts` |
| Integration (IT-001) | Missing        | No Cucumber scenario for profit-measure passing case. Covered by F-001. Implementation summary incorrectly categorised IT-001 as "not applicable".       |
| Smoke                | Not applicable | Issue confirms smoke tests are not applicable.                                                                                                           |
| E2E                  | Not applicable | Issue confirms E2E tests are not applicable.                                                                                                             |
| Regression (REG-001) | Partial        | Existing "lucro por região" scenario covers the spirit of NFR-003 but not the exact English "earnings" scenario. See F-005.                              |
| Performance (PT-001) | Partial        | One `resolve()` call with 500 items under 50 ms. Spec requires 100 iterations of `findMatches()`. See F-004.                                             |
| Security             | Not applicable | Issue confirms security tests are not applicable.                                                                                                        |
| Usability            | Not applicable | Issue confirms usability tests are not applicable.                                                                                                       |
| Observability        | Not applicable | OBS-001 states no new observability requirements.                                                                                                        |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 explicitly states none).

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-003` — Non-blocking — `findRelationshipPath()` and `build()` infer their return types rather than declaring them explicitly. TypeScript can infer these correctly and `noImplicitAny` will not flag them, but FR-001 states "return types" should be explicit. Recommend adding annotations before Task 012.
- `F-006` — Suggestion — UT-004 test description refers to `findMatches()` but the test body calls `resolve()`. The description should be corrected to avoid confusion during future maintenance.

## Unresolved Assumptions or Follow-Up

- The implementation summary claims "Integration / e2e: not applicable; all changes are pure logic with no I/O." However, IT-001 is a Cucumber BDD integration test (in-process, no WASM required) that tests the full ask-data pipeline against a seeded profit catalog. It should be treated as an integration test requiring a `.feature` scenario or equivalent, not as E2E.
- Task 012 (`noImplicitAny` enablement) will fail on `QuestionParser.withOriginalQuestion(result, ...)` unless `result` receives an explicit type. This must be resolved in this task (F-002) or explicitly deferred with a typed overload before Task 012 begins.
- Several other QuestionParser public methods (`parse`, `resolveIntent`, `buildIntentResult`, `listIntent`, `resolveMetric`, `buildShare`, `buildComparison`, `resolveTimeDimension`, `resolveByPhrases`, `resolveDimensions`, `extractByPhrases`) lack explicit return type annotations. These will not block Task 012 (`noImplicitAny` does not require return types), but are not fully compliant with FR-001's "explicit… return types" clause.
