---
id: '005'
created: 2026-05-19
updated: 2026-05-19
status: active
---

# Task: Ask model quality — explicit types, remove false-positive heuristics, fix O(N²) filter scan

## Priority

P2 — Independent improvements to the ask model layer. Does not block or depend on other tasks. Should be completed before Task 006 enables `noImplicitAny`, because this task adds explicit types to the methods that currently infer `any`.

## Dependencies

- No task dependency; can start any time after the audit.
- No ADR dependency; all changes are within existing module boundaries.

## Assignability

**AFK** — all five changes are fully specified with exact locations, expected types, and acceptance criteria.

## Context

Five related quality issues in `src/features/ask/model/`:

**1. Untyped method parameters** (`sql-planner.ts`, `catalog-builder.ts`, `question-parser.ts`): methods like `plan(intent)`, `buildMetricExpr(intent, aliases)`, `buildField({ table, rowCount, col, overrides })` have no explicit parameter types. With `noImplicitAny: false` in `tsconfig.json`, these silently infer `any`. The types already exist in `src/shared/types/ask.ts` (e.g., `AskIntent`, `CatalogField`, `PlannedSql`).

**2. False-positive `unsupportedMetric` blacklist** (`vocabulary.ts:50`): the English vocabulary includes `unsupportedMetric: ['profit', 'margin', 'earnings', 'cost']`. `QuestionParser.detectUnsupportedMetric()` blocks any query containing these words — even when the dataset has a `profit` column. A user asking "show me profit by region" on a dataset with a `Profit` column gets an error: "I could not find a profit metric."

**3. Hardcoded metric priority list** (`ask-data.ts:546-556`): `AskDataEngine.measurePriority()` ranks measures by matching against a hardcoded English name list (`['sales', 'revenue', 'amount', 'profit', ...]`). This gives false-positive boosts to fields in non-English datasets and ignores configured `priority` and `default` metadata.

**4. O(N²) scan in `ValueFilterResolver.findMatches()`** (`value-filter-resolver.ts:43`): inside the accumulation loop, `[...byValue.keys()].some(v => v.includes(match.normalizedValue))` converts the Map's keys to an array and scans it linearly for each match — O(M) per item, O(N×M) total.

**5. Numeric filter values rendered as string literals** (`sql-renderer.ts:8`): the `eq` condition always produces `column = 'value'` regardless of the column's data type. For numeric columns, this forces an implicit cast and may prevent index use. `quoteIdent` and `escapeSqlString` are correct for string values; numeric values should be rendered without quotes.

## Use Cases

- **Feature**: Natural language query on a dataset with a "profit" column
- **Scenario**: User asks about profit on a dataset that has it
- **Given** a Datasource whose catalog includes a `profit` measure field
- **When** the user asks "what is the total profit by region?"
- **Then** the query returns a result (not an "unsupported metric" error)

- **Feature**: Filter value matching on large dimension catalogs
- **Scenario**: AskDataEngine resolves a filter on a dataset with 500 sample values
- **Given** the value catalog contains 500 distinct dimension values
- **When** the user asks a question containing one of those values
- **Then** `findMatches()` completes in under 50 ms

## Definition of Ready

- `src/shared/types/ask.ts` contains the type definitions needed to annotate `intent` (as `AskIntent`), `aliases` (as `Map<string, string>`), and column descriptors.
- The `isNumericType` utility already exists in `src/shared/utils/utils.ts`.

## Functional Requirements

- `FR-001`: All public methods in `SqlPlanner`, `CatalogBuilder`, and `QuestionParser` have explicit TypeScript parameter and return types derived from `src/shared/types/ask.ts`.
- `FR-002`: `detectUnsupportedMetric()` only returns a term as "unsupported" when the term is absent from the catalog's measure fields; it must not block queries for terms that match an actual catalog field.
- `FR-003`: `measurePriority()` falls back to the hardcoded English name list only when neither `field.priority` nor `field.default` is set. Fields with explicit `priority > 0` or `default: true` always rank above the name-heuristic fallback.
- `FR-004`: `ValueFilterResolver.findMatches()` uses a `Set<string>` for O(1) deduplication instead of `[...byValue.keys()].some(...)`.
- `FR-005`: `SqlRenderer.renderCondition()` for the `eq` case detects numeric column types (via `isNumericType(field.type)` on the associated `CatalogField`) and renders numeric values without string quotes: `column = 42` instead of `column = '42'`.

## Non-Functional Requirements

- `NFR-001`: `findMatches()` with 500 sample values processes a 10-word query in under 50 ms in a Node.js environment. Covers `FR-004`.
- `NFR-002`: Adding explicit types must not change any runtime behaviour — the types document existing contracts, not new ones.
- `NFR-003`: The `unsupportedMetric` fix must not break the existing integration tests that verify unsupported metric error messages for truly unavailable terms.

## Observability Requirements

- `OBS-001`: No new observability requirements.

## Acceptance Criteria

- `AC-001`: **Given** a catalog with a `profit` measure field, **When** `detectUnsupportedMetric('what is the total profit')` is called, **Then** `null` is returned (not `'profit'`).
- `AC-002`: **Given** a catalog with no `profit` field, **When** `detectUnsupportedMetric('what is the total profit')` is called, **Then** `'profit'` is returned.
- `AC-003`: **Given** a measure field with `priority: 5`, **When** `getDefaultMetric()` is called, **Then** that field ranks above any field whose priority comes only from the hardcoded name list.
- `AC-004`: **Given** 500 value items in `valueItems`, **When** `findMatches('sales in east region')` is called, **Then** it returns in under 50 ms and produces correct matches without duplicates.
- `AC-005`: **Given** a filter condition with `column.type = 'INTEGER'` and `value = '42'`, **When** `SqlRenderer.renderCondition({ kind: 'eq', ... })` is called, **Then** the rendered SQL is `col = 42` (no quotes).
- `AC-006`: **Given** a filter condition with `column.type = 'VARCHAR'` and `value = 'East'`, **When** `SqlRenderer.renderCondition({ kind: 'eq', ... })` is called, **Then** the rendered SQL is `col = 'East'` (with quotes).

## Required Tests

### Unit Tests

- `UT-001`: Call `detectUnsupportedMetric` with a catalog containing a `profit` field; assert `null`. Covers `FR-002`, `AC-001`.
- `UT-002`: Call `detectUnsupportedMetric` with a catalog containing no `profit` field; assert `'profit'`. Covers `FR-002`, `AC-002`.
- `UT-003`: Call `getDefaultMetric()` with two measures: one with `priority: 5` and one matching the name list; assert the `priority: 5` measure wins. Covers `FR-003`, `AC-003`.
- `UT-004`: Create a `ValueFilterResolver` with 500 value items; call `findMatches` and assert result is correct and the `[...byValue.keys()].some(...)` O(N²) pattern is no longer present in the source. Covers `FR-004`, `AC-004`.
- `UT-005`: Call `SqlRenderer.renderCondition({ kind: 'eq', tableAlias: 't0', column: 'amount', value: '42' })` with the field type `INTEGER`; assert the result is `t0."amount" = 42`. Covers `FR-005`, `AC-005`.
- `UT-006`: Call `SqlRenderer.renderCondition` with type `VARCHAR` and value `'East'`; assert `t0."region" = 'East'`. Covers `FR-005`, `AC-006`.

### Integration Tests

- `IT-001`: **Scenario**: Query on a dataset with a "profit" measure field  
  **Given** a test catalog seeded with a `Profit` measure column  
  **When** the user asks "total profit by region"  
  **Then** the AskDataEngine returns rows, not an `unsupportedMetric` error  
  Covers `FR-002`, `AC-001`.

### Smoke Tests

Not applicable — internal logic changes with no startup impact.

### End-to-End Tests

Not applicable — no user-visible journey changes; correctness is verified at unit and integration level.

### Regression Tests

- `REG-001`: **Scenario**: Truly unsupported metrics still return an error  
  **Given** a catalog with no `earnings` field  
  **When** the user asks "what are the total earnings?"  
  **Then** the AskDataEngine returns an error message listing available measures  
  Covers `NFR-003` — ensures the `unsupportedMetric` fix did not remove the error for genuinely missing metrics.

### Performance Tests

- `PT-001`: Instantiate `ValueFilterResolver` with 500 value items; call `findMatches` 100 times with 10-word queries; assert each call completes in under 50 ms. Covers `NFR-001`, `AC-004`.

### Security Tests

Not applicable — SQL rendering uses `quoteIdent` and `escapeSqlString` consistently; the numeric-literal change does not introduce injection risk because values are passed through `Number(value)` before rendering without quotes.

### Usability Tests

Not applicable — no user-visible behaviour changes; error messages are unaffected for genuinely unsupported metrics.

### Observability Tests

Not applicable — no new telemetry.

## Definition of Done

- All public methods in `SqlPlanner`, `CatalogBuilder`, and `QuestionParser` have explicit parameter types.
- `detectUnsupportedMetric` only blocks terms absent from the catalog.
- `measurePriority` respects configured `priority` and `default` metadata first.
- `ValueFilterResolver.findMatches` uses `Set<string>` for deduplication.
- `SqlRenderer.renderCondition` renders numeric values without quotes.
- `UT-001` through `UT-006`, `IT-001`, `REG-001`, and `PT-001` pass.
- All existing integration tests in `tests/integration/` continue to pass.
- `npm run typecheck` passes without new errors.
