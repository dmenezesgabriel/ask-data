---
id: '013'
created: 2026-05-19
updated: 2026-05-19
status: active
---

# Task: Fix critical bugs — SQL planner typo, localStorage exception, non-unique Datasource IDs

## Priority

P0 — These are production-correct bugs and safety gaps with no dependencies. The SQL typo silently breaks multi-dimension queries. The missing try/catch crashes on quota-exceeded writes. The `Date.now()` ID collides on same-millisecond inserts. All three are one-line fixes.

## Dependencies

- No task dependency; these are isolated fixes that can start immediately.
- No ADR dependency; all three fixes are within existing implementation boundaries.

## Assignability

**AFK** — all three fixes are fully specified with exact file paths and line numbers; no architectural decisions remain open.

## Context

Three independent bugs found in the audit require immediate correction:

1. **SQL planner multi-dimension typo** (`src/features/ask/model/sql-planner.ts:289`): a closing `}` is used instead of `)` inside a template literal in `planGrouped()`. Any grouped query with two or more dimensions produces syntactically invalid SQL (e.g. `CAST(d1 AS VARCHAR} || ' / ' || CAST(d2 AS VARCHAR}`), causing DuckDB to throw a parse error at query time.

2. **Missing try/catch in `persistQuestions()`** (`src/features/question/data/question-registry.ts:35-38`): `localStorage.setItem()` is called without a try/catch. In private-browsing mode or when storage is full, this throws a `QuotaExceededError` that propagates through `addQuestion()` / `updateQuestion()` and crashes the save flow unhandled. The dashboard registry correctly wraps its persist call; the question registry does not.

3. **`Date.now()` used for Datasource ID generation** (`src/features/datasource/data/datasource-registry.ts:111`): `id: \`datasource-${Date.now()}\``is not unique when two Datasources are created within the same millisecond (e.g. during batch seeding or rapid user clicks). The codebase already uses`crypto.randomUUID()`via`CryptoIdGenerator` for the new adapters.

## Use Cases

- **Feature**: Datasource / Question query and save
- **Scenario**: User asks a question grouped by two dimensions
- **Given** a Datasource with a region and category dimension is loaded
- **When** the user asks "total sales by region and category"
- **Then** the AskDataEngine returns a valid result set (not a SQL parse error)

- **Feature**: Question save
- **Scenario**: User saves a Question in a browser with full or restricted storage
- **Given** localStorage is at quota or is unavailable (private-browsing mode)
- **When** the user clicks Save on a Question
- **Then** the save fails silently without an unhandled exception crashing the page

## Definition of Ready

- Exact file paths and line numbers are confirmed in the audit report.
- No schema or API contract changes are required.
- `crypto.randomUUID()` is available in the browser target (confirmed — used in `CryptoIdGenerator`).

## Functional Requirements

- `FR-001`: `planGrouped()` for two or more dimensions generates syntactically valid SQL using `)` to close the `CAST(... AS VARCHAR)` expression.
- `FR-002`: `persistQuestions()` catches `QuotaExceededError` (and any other `localStorage.setItem` error) and swallows it, consistent with `persistDatasources()` and `savePersistedDashboards()` behaviour.
- `FR-003`: `addDatasource()` in `datasource-registry.ts` generates IDs using `crypto.randomUUID()` instead of `Date.now()`.

## Non-Functional Requirements

- `NFR-001`: The fix to `persistQuestions()` must not change the data written to localStorage — only the exception handling changes.
- `NFR-002`: The ID format produced by `crypto.randomUUID()` must not break any existing test fixture that matches on the `datasource-${...}` prefix.

## Observability Requirements

- `OBS-001`: No new observability requirements. These are pure correctness fixes.

## Acceptance Criteria

- `AC-001`: **Given** an `AskIntent` with `dimensions = [regionField, categoryField]` and `analysisType = 'ranking'`, **When** `SqlPlanner.planGrouped()` is called, **Then** the returned `sql` string contains `CAST(d1 AS VARCHAR)` and `CAST(d2 AS VARCHAR)` with a closing `)`, not `}`.
- `AC-002`: **Given** `localStorage.setItem` throws a `QuotaExceededError`, **When** `persistQuestions()` is called, **Then** no exception propagates to the caller.
- `AC-003`: **Given** two calls to `addDatasource()` within the same millisecond, **When** both complete, **Then** the resulting Datasource `id` values are distinct UUIDs.

## Required Tests

### Unit Tests

- `UT-001`: Call `SqlPlanner.planGrouped()` with `intent.dimensions` containing two fields; assert the SQL string contains `CAST(d1 AS VARCHAR)` (with closing `)`) and `CAST(d2 AS VARCHAR)`. Covers `FR-001`, `AC-001`.
- `UT-002`: Call `persistQuestions()` with `localStorage.setItem` stubbed to throw; assert no exception is thrown by the caller. Covers `FR-002`, `AC-002`.
- `UT-003`: Call `addDatasource()` twice synchronously; assert the two `id` fields are distinct UUIDs matching the `crypto.randomUUID()` format. Covers `FR-003`, `AC-003`.

### Integration Tests

Not applicable — all three fixes are in isolated pure functions with no cross-boundary interactions.

### Smoke Tests

Not applicable — these are internal logic fixes with no impact on application startup or page load.

### End-to-End Tests

Not applicable — no complete user journey changes; the fixes restore already-intended behaviour.

### Regression Tests

- `REG-001`: **Scenario**: Multi-dimension query no longer returns a SQL parse error  
  **Given** a Datasource with at least two dimension fields  
  **When** the user asks a question grouped by two dimensions  
  **Then** the result contains rows, not a SQL parse error  
  Covers previous defect F-01 from the audit report.

### Performance Tests

Not applicable — none of the three fixes affect runtime performance.

### Security Tests

Not applicable — these fixes do not touch authentication, authorization, input handling, secrets, or trust boundaries.

### Usability Tests

Not applicable — changes are internal; no user-visible states change.

### Observability Tests

Not applicable — no log, metric, or trace behaviour changes.

## Definition of Done

- Code is changed in exactly three locations: `sql-planner.ts:289`, `question-registry.ts:persistQuestions()`, and `datasource-registry.ts:addDatasource()`.
- `UT-001`, `UT-002`, `UT-003`, and `REG-001` pass.
- TypeScript compiles without error.
- Existing integration and unit tests continue to pass.
