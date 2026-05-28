---
id: "011"
task: "011-fix-question-picker-lit-scheduling-warning"
status: complete
date: 2026-05-28
---

# Implementation: Fix Lit scheduling warning in question-picker

## Files Changed

- `src/features/dashboard/ui/question-picker/question-picker.ts` — lifecycle refactor
- `src/features/dashboard/ui/question-picker/question-picker.spec.ts` — new unit/integration tests

## Behavior Implemented

Moved synchronous reactive-state resets from `updated()` to `willUpdate()` in `QuestionPicker`:

- **`willUpdate()`** (new): when `open` transitions to `true`, resets `_filter = ''`, `_loading = true`, `_error = ''` before `render()` runs. This is the correct Lit lifecycle phase for computing state derived from property changes.
- **`updated()`** (trimmed): now only calls `void this._loadItems()` and `showModal()`/`close()` — pure DOM side-effects. The `_filter = ''` synchronous assignment was removed.
- **`_loadItems()`** (trimmed): removed the `this._loading = true` and `this._error = ''` lines from the top. Those properties are already in the correct state when `_loadItems()` fires because `willUpdate()` set them before render. The `finally` (`_loading = false`) and `catch` (`_error = ...`) lines are unchanged.

This eliminates the extra Lit update cycles that were previously scheduled from inside the post-render phase.

## Tests Added

`question-picker.spec.ts`:

- `UT-001` — Verifies `_loading === true` and `_filter === ''` synchronously after `open` transitions to `true` (uses a never-resolving catalog service to freeze loading state before the microtask resolves). Covers `FR-001`.
- `UT-002` — Verifies `_loading === false` and `_items.length === 1` after `_loadItems()` resolves (uses a real resolving catalog service + `setTimeout(0)` flush). Covers `FR-002`.
- `IT-001` — Verifies that on a second open (`true → false → true`), `_filter` is reset to `''` and `_loading` is `true` again. Covers `AC-003`.
- Global `beforeEach` added to install a resolving catalog service for the 7 pre-existing tests (previously they relied on `_loadItems()` silently catching the "CatalogService not initialized" error).

## Validations Run

- `npx vitest run src/features/dashboard/ui/question-picker/question-picker.spec.ts` — 9/9 pass
- `npx vitest run src/features/dashboard` — 123/123 pass, no regressions
- `npx tsc --noEmit` — no type errors
- Lit scheduling warning for `question-picker` absent from test console output

## Accessibility Checks

No interactive elements, focus behavior, or ARIA patterns changed. Not applicable.

## ADRs Updated

None — this is a component-lifecycle bug fix with no architectural change.

## Intentional Non-Applicable Test Categories

- `E2E-001`: No user-visible behavior change; the fix removes a console warning.
- `PT-001`: The fix removes an extra render cycle, improving performance rather than introducing risk.
- `ST-001`: No new input, storage, auth, or external communication.

## Unresolved Assumptions

The `widget-editor`, `datasource-editor`, and `question-editor` components emit the same Lit scheduling warning in test output. These are pre-existing issues outside this task's scope.
