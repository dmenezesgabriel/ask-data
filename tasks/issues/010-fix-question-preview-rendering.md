---
id: "010"
created: 2026-05-25
updated: 2026-05-25
status: active
---

# Task: Fix question preview rendering to show chart or table after query execution

## Priority

P1 — The "Run preview" button in the Question editor appears to execute but the preview area shows only the widget title with no chart, table, or data. This breaks the question authoring feedback loop.

## Dependencies

- No task dependency; can start concurrently with other tasks.
- No ADR dependency; this task fixes a data-conversion and rendering issue inside existing component code.

## Assignability

**AFK** — all requirements and acceptance criteria are resolved; the root cause is identified and the fix follows an existing pattern used in the dashboard workspace.

## Context

When a user opens a Question in the editor and clicks "Run preview", the following flow executes:

1. `question-editor-panel.runPreview()` calls `_runSqlPreview(query)` (or `_runNaturalLanguagePreview`)
2. `_runSqlPreview` executes the query via `queryPort.query(query)`, which returns an Apache Arrow `Table` (in client-only mode)
3. `toRows(result)` converts the Arrow Table to an array of row objects
4. Labels and values are extracted: `rows.map(r => r['label'] ?? r[Object.keys(r)[0]])` and `rows.map(r => r['value'] ?? r[Object.keys(r)[1]])`
5. `_previewData = { labels, values, rows }` is set
6. The preview template renders `<app-widget .config=${widgetConfig} .data=${this._previewData}>`
7. The widget's `updated()` lifecycle calls `_initChart()` which creates a Chart.js instance from the canvas element

The title always renders because the widget header is unconditional. The chart/table may fail for several reasons:

### Root cause analysis

The most likely failure point is **BigInt values returned by DuckDB** not being converted to numbers. The dashboard workspace's `_executeSqlQuery()` (in `dashboard-workspace-model.ts`) explicitly maps BigInt values:

```typescript
const rows = toRows(result).map((row) =>
    Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]),
    ),
);
```

The question editor's `_runSqlPreview()` does NOT perform this conversion. DuckDB-WASM frequently returns `BIGINT` and `INTEGER` columns as JavaScript `BigInt` values. When Chart.js receives `BigInt` values where `number[]` is expected, it either throws silently or produces an invisible chart.

Secondary concern: the `_initChart()` method in `widget.ts` calls `this.querySelector('canvas')`. If Lit's rendering hasn't flushed the canvas element into the DOM yet, the chart initialization silently bails.

## Use Cases

- **Feature**: Question authoring
- **Scenario**: Analyst previews a SQL question
- **Given** an analyst is editing a Question with a valid SQL query and linked datasources
- **When** the analyst clicks "Run preview"
- **Then** the preview area renders the query result as a chart, table, or KPI depending on the question type

## Definition of Ready

- The dashboard workspace already has working BigInt conversion in `dashboard-workspace-model.ts`.
- The `toRows()` and `widget.ts` rendering paths are understood.

## Functional Requirements

- `FR-001`: `_runSqlPreview()` must convert `BigInt` values to `Number` in all row results before building `_previewData`.
- `FR-002`: `_runNaturalLanguagePreview()` must also convert `BigInt` values to `Number` for consistency.
- `FR-003`: The widget's `updated()` lifecycle must re-initialize the chart when `data` changes, not only on first render.
- `FR-004`: An error state in the preview must render the error message and not leave a stale partial state.

## Non-Functional Requirements

- `NFR-001`: The BigInt conversion must use the same pattern as the dashboard workspace (`Object.entries().map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])`).
- `NFR-002`: Chart re-initialization must destroy the previous Chart.js instance before creating a new one (already done in `_destroyChart()`).

## Observability Requirements

- `OBS-001`: Log a warning when `_runSqlPreview` receives zero rows after toRows conversion, including the query text. This helps distinguish empty-result from conversion-failure cases.
- `OBS-002`: Log a warning when `_initChart()` finds no canvas element or a null context, including the widget id.

## Acceptance Criteria

- `AC-001`: **Given** a Question with a SQL query that returns BIGINT columns, **When** "Run preview" is clicked, **Then** the preview renders a chart with the query results (visible bars/lines/points).
- `AC-002`: **Given** a Question with a SQL query that returns 0 rows, **When** "Run preview" is clicked, **Then** the preview shows an "empty result" state (not stale previous data).
- `AC-003`: **Given** a Question with a SQL query that fails during execution, **When** "Run preview" is clicked, **Then** the preview shows the error message.
- `AC-004`: **Given** a Question with type "table", **When** "Run preview" is clicked, **Then** the preview renders a data table with column headers.
- `AC-005`: **Given** seed Question "Sales by Region" (chart type), **When** "Run preview" is clicked, **Then** a bar chart with 4 regions is rendered.

## Required Tests

### Unit Tests

- `UT-001`: Verify that `_runSqlPreview` converts BigInt values to Number in row data. Covers `FR-001`.
- `UT-002`: Verify that row objects without a `label` key use the first key as label, and rows without a `value` key use the second key as value. Covers edge case.
- `UT-003`: Verify that `_initChart()` destroys the previous chart instance before creating a new one when `data` changes. Covers `NFR-002`.

### Integration Tests

- `IT-001`: **Scenario**: Question editor runs preview and renders widget  
  **Given** a Question with linked "sales" datasource and a valid SQL query  
  **When** the question-editor-panel component calls `runPreview()`  
  **Then** `_previewData` is set with `labels`, `values`, and `rows`  
  **And** the rendered template contains a `<canvas>` or `<table>` element  
  Covers `FR-001`, `FR-002`, `FR-003`.

### End-to-End Tests

- `E2E-001`: **Scenario**: Preview a seed question  
  **Given** the app is running in client-only mode  
  **When** the user navigates to the "Sales by Region" question and clicks "Run preview"  
  **Then** a bar chart renders in the preview area  
  Covers `AC-005`.

### Regression Tests

- `REG-001`: **Scenario**: Dashboard workspace queries still work after BigInt conversion fix  
  **Given** the Portable BI Dashboard loads  
  **When** the dashboard queries execute on load  
  **Then** all KPI cards show numeric values and charts render correctly  
  Covers previous working behavior.

### Performance Tests

- `PT-001`: Not applicable — BigInt conversion is O(n) on already-loaded row data with negligible overhead.

### Security Tests

- `ST-001`: Not applicable — no new input, storage, auth, or external communication is introduced.

### Usability Tests

- `UX-001`: **Given** a question editor with no datasources linked, **When** "Run preview" is clicked, **Then** the preview area shows a clear message explaining that datasources must be linked first (covers the early-return path in `runPreview()`). Covers `FR-004`.

### Observability Tests

- `OT-001`: Verify that a zero-row query result produces a warning log with query text. Covers `OBS-001`.
- `OT-002`: Verify that a chart initialization failure (missing canvas) produces a warning log. Covers `OBS-002`.

## Definition of Done

- `_runSqlPreview()` converts BigInt values to Number using the same pattern as the dashboard workspace.
- `_runNaturalLanguagePreview()` applies the same conversion.
- The widget's `updated()` hook re-initializes the chart when `data` binding changes.
- Error and empty states render appropriate messages.
- All required tests pass.
