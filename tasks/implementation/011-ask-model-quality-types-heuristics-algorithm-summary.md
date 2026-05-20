# Task 011 — Ask-Model Quality: Types, Heuristics, Algorithm

## Files changed

- `src/shared/types/ask.ts` — added `fieldType?: string` to the `eq` member of `WhereCondition`
- `src/features/ask/model/sql-renderer.ts` — `renderCondition` eq case renders numeric types as unquoted literals using `isNumericType()`
- `src/features/ask/model/ask-data.ts` — `measurePriority()` returns `1000 + priority` for any `priority > 0`, ensuring explicit priority always beats the name-heuristic max of 100
- `src/features/ask/model/value-filter-resolver.ts` — `resolve()` uses a `Set<string>` for O(1) exact-duplicate guard before the substring-domination check, eliminating the O(N²) array spread
- `src/features/ask/model/sql-planner.ts` — explicit parameter and return types on all public methods; `intent.metric` cast to `any` locally in `plan()` and `buildMetricExpr()` to satisfy the `IntentMetric` union without breaking the existing runtime behaviour; `aliases.get()` guarded with `?? ''`; `intent.change` accessed with optional chaining
- `src/features/ask/model/catalog-builder.ts` — explicit types on all public methods; local `SchemaRow` interface; `Partial<FieldConfig>` annotation; `?? 0` guard on `rel.confidence`
- `src/features/ask/model/question-parser.ts` — explicit types on all public methods; local type aliases; `as SortDirection` cast; `as CellValue[]` cast; `as IntentFilter` for comparison filter; unused `MaybeClarifiable` type removed
- `src/features/ask/model/sql-planner.spec.ts` — `IntentMetric` import added; `count_distinct` mock cast to `IntentMetric`; `fieldType: 'VARCHAR'` added to eq condition assertion
- `src/features/ask/model/sql-renderer.spec.ts` — UT-005/UT-006 added
- `src/features/ask/model/value-filter-resolver.spec.ts` — UT-004 added (500-item performance assertion, 50ms budget)
- `src/features/ask/model/question-parser.spec.ts` — UT-001/UT-002 added for `detectUnsupportedMetric`
- `src/features/ask/model/ask-data.spec.ts` — new file; UT-003 for `measurePriority`

## Behaviour implemented

- **FR-001**: All public methods in `SqlPlanner`, `CatalogBuilder`, and `QuestionParser` now carry explicit parameter and return types, enabling `noImplicitAny` to be activated in Task 012 without breaking changes.
- **FR-002**: `detectUnsupportedMetric` was already correctly implemented; tests added to cover both the pass-through (`null`) and blocking cases.
- **FR-003**: `measurePriority` fields with `priority > 0` now always rank above the name-heuristic maximum (score `1000 + priority` vs. heuristic max `100`).
- **FR-004**: `ValueFilterResolver.resolve()` uses `Set.has()` for O(1) exact-value deduplication; no array allocation per iteration.
- **FR-005**: `SqlRenderer.renderCondition()` renders numeric eq conditions as unquoted numeric literals (`col = 42` instead of `col = '42'`).

## Tests added or updated

| ID     | File                          | Description                                                                 |
| ------ | ----------------------------- | --------------------------------------------------------------------------- |
| UT-001 | question-parser.spec.ts       | `detectUnsupportedMetric` returns null when term matches catalog measure    |
| UT-002 | question-parser.spec.ts       | `detectUnsupportedMetric` returns term when absent from catalog measures    |
| UT-003 | ask-data.spec.ts              | `measurePriority` with `priority: 5` beats "sales" name-heuristic score     |
| UT-004 | value-filter-resolver.spec.ts | `resolve()` with 500-item catalog completes within 50ms                     |
| UT-005 | sql-renderer.spec.ts          | `renderCondition` with `INTEGER` fieldType renders unquoted numeric literal |
| UT-006 | sql-renderer.spec.ts          | `renderCondition` with `VARCHAR` fieldType renders single-quoted string     |

## Validations run

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run test:unit` — 691 tests, 48 files, all pass

## ADRs updated

None — no architectural decisions changed.

## Intentional non-applicable test categories

- Integration / e2e: not applicable; all changes are pure logic with no I/O.
- Mutation testing: out of scope for this task.

## Unresolved assumptions

- `noImplicitAny` is still `false`. FR-001 is preparatory — enabling strict `noImplicitAny` is deferred to Task 012.
- The `as any` cast in `plan()` / `buildMetricExpr()` is a deliberate bridge: the `IntentMetric` union conflates `CatalogField` (no `kind`) with `CountStarMetric` / `CountDistinctMetric` (no `table`/`column`). Proper narrowing without `any` requires either a type guard helper or refactoring `IntentMetric` to add a discriminant to `CatalogField`; that is deferred to a follow-up task.
