---
id: "014"
task: "014-fix-lit-change-in-update-four-components"
date: 2026-05-28
status: complete
---

# Implementation: Fix Lit "change-in-update" scheduling warning on four components

## Files changed

| File | Change |
|---|---|
| `src/features/dashboard/ui/widget-editor/widget-editor.ts` | Renamed `updated()` → `willUpdate()` for `_panelConfig` derivation |
| `src/features/datasource/ui/datasource-editor/datasource-editor.ts` | Added `willUpdate()` resetting sync state; stripped sync resets from `_loadConfig()`; added `void` to the `updated()` call |
| `src/features/question/ui/question-editor/question-editor.ts` | Added `willUpdate()` resetting sync state; stripped sync resets from `_loadConfig()`; added `void` to the `updated()` call |
| `src/features/datasource/ui/datasource-picker/datasource-picker.ts` | Added `willUpdate()` resetting `_filter`, `_pendingSlugs`, `_loading`, `_error`; stripped sync resets from `_loadItems()` |
| `src/features/dashboard/ui/widget-editor/widget-editor.spec.ts` | Added UT-001 |
| `src/features/datasource/ui/datasource-editor/datasource-editor.spec.ts` | New — UT-002 |
| `src/features/question/ui/question-editor/question-editor.spec.ts` | New — UT-003 |
| `src/features/datasource/ui/datasource-picker/datasource-picker.spec.ts` | New — UT-004 |

## Behavior implemented

- `widget-editor`: `_panelConfig` now derived in `willUpdate()` — no extra render cycle when `widget` changes.
- `datasource-editor`: sync state resets (`_loadError`, `_isDirty`, `_nameError`, `_urlError`) moved to `willUpdate()`; async `_loadConfig()` remains in `updated()`.
- `question-editor`: sync state resets (`_error`, `_isDirty`) moved to `willUpdate()`; async `_loadConfig()` remains in `updated()`.
- `datasource-picker`: sync state resets (`_filter`, `_pendingSlugs`, `_loading`, `_error`) moved to `willUpdate()`; async `_loadItems()` and DOM side-effects remain in `updated()`. Note: `_loading` and `_error` were also moved (beyond the FR-004 minimum) because they were set synchronously at the top of `_loadItems()` before the first await, producing the same scheduling warning — matching the established `question-picker` pattern.

## Tests added or updated

- `UT-001` (widget-editor.spec.ts): `_panelConfig` reflects new widget before next render.
- `UT-002` (datasource-editor.spec.ts): sync state resets when `slug` changes.
- `UT-003` (question-editor.spec.ts): sync state resets when `slug` changes.
- `UT-004` (datasource-picker.spec.ts): `_filter` and `_pendingSlugs` reset on `open=true`.

## Validations run

- `npx vitest run` — 1006 tests pass, 0 failures, 0 regressions.
- No "scheduled an update after an update completed" warning emitted in any of the four component test runs.

## Accessibility checks

Not applicable — no interactive UI, ARIA, focus, or keyboard behavior changed.

## ADRs updated

None — this fix applies the already-established `willUpdate()` pattern from task 011; no new architectural decision needed.

## Intentional non-applicable test categories

Integration, Smoke, E2E, Regression, Performance, Security, Usability, Observability — no service boundary, deploy path, or user-visible behavior changed (per task definition).

## Unresolved assumptions

None.
