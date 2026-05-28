---
id: "010-review"
issue: "tasks/reviews/010-fix-question-preview-rendering-review.md"
created: 2026-05-28
updated: 2026-05-28
---

# Implementation: Address review findings for task 010

## Files Changed

| File | Change |
|------|--------|
| `src/features/dashboard/ui/widget/widget.ts` | F-003: Removed redundant `_destroyChart()` call at old line 272 inside `_initChart()` |
| `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts` | F-002a: Added `canvas` assertion to IT-001 test; F-002b: Added BigInt NL preview unit test |
| `tests/e2e/features/questions.feature` | F-001: Added E2E scenario "Preview the Sales by Region seed question renders a bar chart" |
| `tests/e2e/steps/steps.ts` | F-001: Added step `Then the preview area should contain a canvas element` |

## Behavior Implemented

### F-001 (Blocking)
Added E2E scenario `E2E-001` to `questions.feature`. The scenario navigates to `#/question/sales-by-region`, clicks "Run preview", and asserts a `canvas` element is present inside `.qep-preview`. DuckDB-WASM initialization can take up to 60 s; the step uses a 60 s `waitForFunction` timeout (step-level timeout 70 s) to accommodate that.

### F-002 (Non-blocking)
- **IT-001 canvas assertion**: Added `expect(el.querySelector('app-widget canvas')).not.toBeNull()` to the SQL-preview component test. The widget renders `<canvas>` when `type === 'chart'` and `data` is set; in jsdom, Chart.js logs a warning about null context but the canvas element is still in the DOM.
- **FR-002 BigInt NL path**: Added a new unit test `converts BigInt values to Number in natural-language preview row data` that passes `9n`/`15n` through the ask engine mock and asserts the resulting `values` are plain `number` and `rows[0].value` is `'number'`.

### F-003 (Suggestion)
Removed the `_destroyChart()` call on the line immediately before `new Chart(...)` inside `_initChart()`. The `updated()` lifecycle already calls `_destroyChart()` before every `_initChart()` invocation, so the internal call was a no-op double-destroy.

## Tests Added or Updated

- `question-editor-panel.spec.ts`: +1 assertion (canvas) to IT-001 test; +1 new unit test for NL BigInt conversion
- `tests/e2e/features/questions.feature`: +1 scenario (E2E-001)
- `tests/e2e/steps/steps.ts`: +1 step definition

## Validations Run

- `npx vitest run` on `widget.spec.ts` + `question-editor-panel.spec.ts`: **26 tests, all pass**
- `npx tsc --noEmit`: **no errors**

## Accessibility

No UI structure changed; accessibility check not required.

## ADRs Updated

None.

## Intentional Non-Applicable Test Categories

- PT-001, ST-001: unchanged from task 010 — no new data paths or surfaces introduced.

## Unresolved Assumptions

- The E2E scenario (`E2E-001`) requires DuckDB-WASM to initialize and execute a JOIN query against `superstore-sales` + `superstore-customers` seed CSVs. On the documented constrained hardware (i5-1135G7, ~1.6 GB free RAM), this may be slow but should fit within the 60 s wait. If the CSV URLs are unreachable in CI, the step will time out — this is a pre-existing environment constraint, not a new failure introduced here.
