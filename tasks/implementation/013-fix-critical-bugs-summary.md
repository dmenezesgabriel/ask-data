---
id: '013'
created: 2026-05-21
status: done
---

# Implementation Summary: Fix critical bugs — SQL planner typo, localStorage exception, non-unique Datasource IDs

## Files changed

| File                                                        | Change                                                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/ask/model/sql-planner.ts:317`                 | Fixed `}` → `)` in `planGrouped()` CAST expression                                                                                        |
| `src/features/ask/model/sql-planner.ts:432`                 | Added explicit `Relationship[] \| null` return type to `findRelationshipPath()` (incidental TypeScript improvement caught during the fix) |
| `src/features/question/data/question-registry.ts:36-41`     | Wrapped `localStorage.setItem` in `persistQuestions()` with try/catch                                                                     |
| `src/features/datasource/data/datasource-registry.ts:23-27` | Wrapped `localStorage.setItem` in `persistDatasources()` with try/catch (same latent QuotaExceededError gap as `persistQuestions`)        |
| `src/features/datasource/data/datasource-registry.ts:99`    | Replaced `Date.now()` with `crypto.randomUUID()` in `addDatasource()`                                                                     |
| `src/features/ask/model/sql-planner.spec.ts`                | Added UT-001: two-dimension CAST expression test                                                                                          |
| `src/features/question/data/question-registry.spec.ts`      | Added UT-002: QuotaExceededError swallow test                                                                                             |
| `src/features/datasource/data/datasource-registry.spec.ts`  | Added UT-003: UUID uniqueness test; added QuotaExceededError swallow test for `persistDatasources`                                        |

## Behaviour implemented

- **FR-001**: `planGrouped()` now produces `CAST(d1 AS VARCHAR)` / `CAST(d2 AS VARCHAR)` (closing `)`) instead of the invalid `}`. Multi-dimension grouped queries no longer produce a DuckDB parse error.
- **FR-002**: `persistQuestions()` now swallows any `localStorage.setItem` error, matching the pattern already used in `persistDatasources()` and `savePersistedDashboards()`. Question saves no longer crash in private-browsing or quota-exceeded environments.
- **FR-003**: `addDatasource()` generates IDs via `crypto.randomUUID()`, producing collision-free UUIDs consistent with `CryptoIdGenerator` used elsewhere.

## Tests added

- **UT-001** (`sql-planner.spec.ts`): Plans a ranking query with `[regionField, categoryField]` and asserts `CAST(d1 AS VARCHAR)` and `CAST(d2 AS VARCHAR)` appear in SQL with closing `)`. Uses existing `threeTableRelationships` fixture.
- **UT-002** (`question-registry.spec.ts`): Stubs `localStorage.setItem` to throw `QuotaExceededError`; asserts `addQuestion()` does not propagate the error.
- **UT-003** (`datasource-registry.spec.ts`): Calls `addDatasource()` twice synchronously; asserts the two IDs are distinct and match the UUID v4 pattern.

## Validations run

- `vitest run --project unit` (targeted files): 97/97 pass
- `vitest run --project unit` (full suite): 694/694 pass
- `tsc --noEmit`: no errors

## Accessibility checks

Not applicable — no UI changes.

## ADRs updated

None — all three fixes are within existing implementation boundaries with no architectural decisions changed.

## Intentional non-applicable test categories

- Integration, smoke, e2e, performance, security, usability, observability: as specified in the task (internal logic fixes with no cross-boundary or user-visible changes).

## Unresolved assumptions

None.
