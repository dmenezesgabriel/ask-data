---
id: "010"
issue: "tasks/issues/010-fix-question-preview-rendering.md"
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Fix question preview rendering to show chart or table after query execution

## Related Task

- `tasks/issues/010-fix-question-preview-rendering.md`

## Files Changed

- `src/features/question/ui/question-editor-panel/question-editor-panel.ts` — Add BigInt conversion, zero-rows warning, and missing-datasource error in `runPreview()`
- `src/features/dashboard/ui/widget/widget.ts` — Add warning logs when canvas element or 2d context is not found in `_initChart()`
- `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts` — Add tests for BigInt conversion, row key fallback, zero-rows warning, and missing-datasource error
- `src/features/dashboard/ui/widget/widget.spec.ts` — New file: tests for chart re-initialization on data change and missing canvas warning

## Behavior Implemented

- `_runSqlPreview()` converts BigInt values to Number after `toRows()`, matching the existing pattern in `dashboard-workspace.ts` (FR-001, NFR-001)
- `_runNaturalLanguagePreview()` also converts BigInt values to Number for consistency (FR-002)
- `_runSqlPreview()` logs a warning when query returns zero rows (OBS-001)
- `runPreview()` sets `_previewError` instead of silently returning when no datasources are linked, and `_renderPreview()` now shows the error before the datasource-placeholder (FR-004, UX-001)
- `_initChart()` in widget.ts logs a warning when the canvas element is missing or context is null (OBS-002)
- Widget chart already re-initializes on data change via existing `updated()` lifecycle (FR-003 was already implemented)

## Design Notes

- BigInt conversion follows the identical pattern (`Object.entries().map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])`) as the dashboard workspace to maintain consistency (NFR-001)
- No new abstractions were introduced — changes are in-place in existing methods
- Test patterns follow existing component test conventions (mount/cleanup/updateComplete helpers, spyOn for console)

## Tests Added or Updated

- `question-editor-panel.spec.ts` — `UT-001`: verifies BigInt values are converted to Number in `_runSqlPreview()`
- `question-editor-panel.spec.ts` — `UT-002`: verifies row objects without `label`/`value` keys use positional fallback
- `question-editor-panel.spec.ts` — `OT-001`: verifies zero-row query logs warning with query text
- `question-editor-panel.spec.ts` — `UX-001`: verifies error message when `runPreview()` is clicked without linked datasources
- `widget.spec.ts` — `UT-003`: verifies chart re-initializes on data change (destroy old, create new)
- `widget.spec.ts` — `OT-002`: verifies warning log when canvas element is missing in `_initChart()`

## Test Categories Not Applicable

- `E2E`: Not applicable — this task fixes data-conversion and rendering logic covered by component tests; full E2E flows require seeded data and navigation which is outside scope
- `Integration`: Not applicable — the Cucumber integration tests run against real Arrow Table results and would require seed datasources; the BigInt conversion is tested at the component level
- `Performance`: Not applicable — BigInt conversion is O(n) on already-loaded row data with negligible overhead
- `Security`: Not applicable — no new input, storage, auth, or external communication introduced

## Validation Run

```text
npm run test:unit — 737 passed
npm run test:components — 152 passed
npm run test — all unit, component, storybook, integration, and E2E tests passed
npm run lint — passed
npm run typecheck — passed
```

## Accessibility Notes

Not applicable — this task does not add new interactive UI, forms, or navigation elements. Existing ARIA labels and error announcements in the preview area are unchanged.

## Observability Changes

- `question-editor-panel.ts`: Added warning log `query.zeroRows` with query text when `_runSqlPreview` receives zero rows (OBS-001)
- `widget.ts`: Added warning logs `chart.init.missingCanvas` and `chart.init.nullContext` with widget id when `_initChart()` cannot find the canvas element or its 2d context (OBS-002)

## ADR Updates

Not applicable — this task fixes a data-conversion and rendering issue inside existing component code with no architectural impact.

## Unresolved Assumptions or Follow-Up

- The `_initChart()` warning logs rely on correct widget `id` in `config`. If a widget is created without an id, the log will show an empty string. This matches the existing pattern in the `updated()` lifecycle.
