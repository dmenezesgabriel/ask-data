---
id: '005'
issue: 'tasks/issues/005-isolate-semantic-model-domain-types.md'
created: 2026-05-25
updated: 2026-05-25
---

# Review: Isolate Semantic Model and Ask Data Domain Types

## Related Task

- `tasks/issues/005-isolate-semantic-model-domain-types.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

None.

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `src/core/entities/ask.ts` now owns stable Ask Data and Semantic Model contracts, and `src/core/application/ports/ask-engine.ts` imports them from `@/core/entities`. A core import search found no imports of `shared/types/ask`, Fuse, MiniSearch, Transformers.js, or chrono modules in the reviewed core Ask Data contract and port files.                                                                                         |
| AC-002 | Pass   | Existing Ask Data parser, planner, matcher, and narrative-adjacent behavior tests passed: `npm run test:unit -- src/core/entities/ask.spec.ts src/core/application/use-cases/ask-data/ask-data.spec.ts src/features/ask/model/ask-data.spec.ts src/features/ask/model/question-parser.spec.ts src/features/ask/model/sql-planner.spec.ts src/features/ask/model/semantic-field-matcher.spec.ts` reported 6 files and 90 tests passing. |
| AC-003 | Pass   | Fuse and MiniSearch type aliases remain in `src/shared/types/ask.ts:468-470`, outside stable core contracts. The stable core Ask Data contracts in `src/core/entities/ask.ts` contain no Fuse or MiniSearch imports.                                                                                                                                                                                                                   |

## Test Coverage Evaluation

| Test Category          | Status         | Notes                                                                                                                                                                                                    |
| ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)          | Present        | `src/core/entities/ask.spec.ts:3-42` imports `AskDataConfig`, `AskDataResponse`, and `SemanticModel` from core and exercises the stable type surface without matcher-library imports.                    |
| Unit (UT-002)          | Present        | Existing parser, planner, matcher, and Ask Data model tests were run and passed after type relocation.                                                                                                   |
| Integration (IT-001)   | Present        | `src/core/application/use-cases/ask-data/ask-data.spec.ts:63-71` executes the `AskData` use case through a fake `AskEngine` and asserts the response matches the stable core `AskDataResponse` contract. |
| Smoke (SMK-001)        | Present        | `npm run typecheck` completed successfully.                                                                                                                                                              |
| E2E (E2E-001)          | Not applicable | The issue marks E2E as not applicable because behavior should remain unchanged and is covered by existing Ask Data flows.                                                                                |
| Regression (REG-001)   | Present        | Existing parser and SQL planner regression coverage was included in the passing unit test run, including `question-parser.spec.ts` and `sql-planner.spec.ts`.                                            |
| Performance (PT-001)   | Not applicable | The issue marks performance tests as not applicable because type relocation does not change runtime algorithm paths.                                                                                     |
| Security (ST-001)      | Not applicable | The issue marks security tests as not applicable because no input handling or trust boundary behavior changed.                                                                                           |
| Usability (UX-001)     | Not applicable | The issue marks usability tests as not applicable because no UI changed.                                                                                                                                 |
| Observability (OT-001) | Not applicable | The issue marks observability tests as not applicable because runtime telemetry is unchanged.                                                                                                            |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task.

## ADR Compliance

| ADR                                                     | Required Action                                                                   | Status                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `docs/adrs/001-define-clean-architecture-boundaries.md` | Update from Proposed or leave with explicit open questions per Definition of Done | Compliant — still `Proposed`, with explicit open questions at lines 42-45. |
| `docs/adrs/002-establish-bi-extension-platform.md`      | Update from Proposed or leave with explicit open questions per Definition of Done | Compliant — still `Proposed`, with explicit open questions at lines 43-46. |

## Convention Notes

None.

## Unresolved Assumptions or Follow-Up

- `git diff main...HEAD` could not be used because `main` is not available in this checkout; the review used the working tree diff plus direct reads of the changed implementation and test files.
- `npm run lint` fails on an existing unrelated boundary violation in `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts:5`; this is outside the reviewed Ask Data and Semantic Model type-boundary implementation.
