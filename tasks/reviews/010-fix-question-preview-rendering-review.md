---
id: "010"
issue: "tasks/issues/010-fix-question-preview-rendering.md"
created: 2026-05-28
updated: 2026-05-28
---

# Review: Fix question preview rendering to show chart or table after query execution

## Related Task

- `tasks/issues/010-fix-question-preview-rendering.md`

## Overall Verdict

**Fail**

Blocked by F-001. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | Blocking | E2E-001 / AC-005 | E2E scenario for the "Sales by Region" seed question preview was not added. This is the only test that covers AC-005 ("a bar chart with 4 regions is rendered"). The implementation summary declares E2E "Not applicable" without updating the issue's required tests. AC-005 has zero test coverage. | `tests/e2e/features/questions.feature` — no Run-preview scenario present |
| F-002 | Non-blocking | IT-001 | The component test at line 178 of `question-editor-panel.spec.ts` covers FR-001/FR-003 (query executes, app-widget appears) but does not assert that `<canvas>` or `<table>` is present inside the widget as IT-001 required. FR-002 BigInt conversion in `_runNaturalLanguagePreview` is also not specifically tested — the existing NL test mock uses plain numbers, not BigInt values. | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:201` — mock uses `value: 9`, not `9n` |
| F-003 | Suggestion | NFR-002 | `_initChart()` calls `_destroyChart()` at line 272 even though `updated()` already called `_destroyChart()` at line 249 before invoking `_initChart()`. The double-destroy is harmless but redundant. | `src/features/dashboard/ui/widget/widget.ts:249,272` |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | BigInt conversion is implemented in `_runSqlPreview()` at `question-editor-panel.ts:159–163`; UT-001 at `question-editor-panel.spec.ts:84` verifies values convert from `9n`/`15n` to `9`/`15`. |
| AC-002 | Pass | `_previewData` is set to `{ labels: [], values: [], rows: [] }` when zero rows (line 166), clearing stale data. Table type reaches `_renderEmpty()` in `widget.ts:212` showing "No data available". Chart type renders an empty canvas. |
| AC-003 | Pass | Catch block in `runPreview()` at line 198 sets `_previewError = String(err)`; `_renderPreview()` at line 370 renders `<div class="qep-preview-error">`. Covered by existing error test at `question-editor-panel.spec.ts:234`. |
| AC-004 | Pass | `_renderTable()` at `widget.ts:178` renders `<thead>` using `this.config.columns ?? ['Label', 'Value']`. The preview path at `question-editor-panel.ts:383` passes `widgetConfig.columns = this.config.columns`. Column headers always render. |
| AC-005 | Fail | No E2E test navigates to the "Sales by Region" question and verifies a bar chart with 4 regions. The existing `questions.feature` has no Run-preview scenario. See F-001. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:84` — asserts values and row value type are `number`. |
| Unit (UT-002) | Present | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:118` — asserts positional key fallback produces correct labels and values. |
| Unit (UT-003) | Present | `src/features/dashboard/ui/widget/widget.spec.ts:45` — asserts new chart instance is not `===` to initial instance after data change. |
| Integration (IT-001) | Partial | Component test at `question-editor-panel.spec.ts:178` covers runPreview execution and app-widget rendering but does not assert `<canvas>` or `<table>` inside the widget. FR-002 BigInt path in NL preview is untested. See F-002. |
| E2E (E2E-001) | Missing | No scenario added to `tests/e2e/features/questions.feature` for seed question preview. See F-001. |
| Regression (REG-001) | Present | Covered by existing `tests/e2e/features/dashboard-workspace.feature` scenarios ("Injecting a sheet with chart widgets renders the widgets" / "the chart widgets should initialize without errors"). No new regression test needed since no dashboard-workspace code was changed. |
| Performance (PT-001) | Not applicable | Marked not applicable in issue — O(n) conversion with negligible overhead. |
| Security (ST-001) | Not applicable | Marked not applicable in issue — no new input, storage, auth, or external surface introduced. |
| Usability (UX-001) | Present | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:254` — asserts `.qep-preview-error` contains "Link at least one datasource". |
| Observability (OT-001) | Present | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:151` — asserts `console.warn` called with string containing `query.zeroRows` and object containing query text. |
| Observability (OT-002) | Present | `src/features/dashboard/ui/widget/widget.spec.ts:64` — asserts `console.warn` called with string containing `chart.init.missingCanvas` and object with `widgetId: 'chart-1'`. |

## Observability Evaluation

| OBS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| OBS-001 | Log warning when `_runSqlPreview` receives zero rows, including query text | Met | `logger.warn('query.zeroRows', { query })` at `question-editor-panel.ts:165`. OT-001 verifies the call. |
| OBS-002 | Log warning when `_initChart()` finds no canvas element or null context, including widget id | Met | `logger.warn('chart.init.missingCanvas', { widgetId: this.config.id })` at `widget.ts:262`; `logger.warn('chart.init.nullContext', { widgetId: this.config.id })` at `widget.ts:268`. OT-002 verifies the missing-canvas path. |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-003` — Suggestion — `widget.ts:272` calls `_destroyChart()` inside `_initChart()` after a successful canvas lookup, but the `updated()` lifecycle at line 249 already calls `_destroyChart()` before every `_initChart()` call. The defensive call inside `_initChart()` is harmless but creates a double-destroy on every data update. This does not violate NFR-002 (NFR-002 only requires that a destroy happen before creating a new instance, which it does).

## Unresolved Assumptions or Follow-Up

- E2E-001 requires the app to run in client-only mode with the "Sales by Region" seed question loaded. Given the documented hardware constraints (i5-1135G7, ~1.6 GB free RAM), this test can be added to the existing `questions.feature` file alongside the current CRUD scenarios. The test only needs to navigate to `#/question/sales-by-region`, click "Run preview", and assert a `canvas` element is present in the preview area — it does not need to assert exact pixel rendering, which avoids heavy browser snapshot comparisons.
- IT-001's missing canvas/table assertion: the simplest fix is to add `expect(el.querySelector('app-widget canvas')).not.toBeNull()` or `expect(el.querySelector('app-widget table')).not.toBeNull()` to the existing SQL-preview test at `question-editor-panel.spec.ts:197`.
