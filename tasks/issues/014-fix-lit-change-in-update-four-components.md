---
id: "014"
created: 2026-05-28
updated: 2026-05-28
status: active
---

# Task: Fix Lit "change-in-update" scheduling warning on four components

## Priority

P2 — Dev-mode warning only; no user-visible breakage. Safe to tackle after BUG-1 and BUG-2 are resolved.

## Dependencies

- No task dependency; each component fix is independent.
- No ADR dependency; the `willUpdate()` fix pattern is already established in task 011 (`question-picker`).

## Assignability

**AFK** — the fix pattern is fully specified (move synchronous state resets from `updated()` to `willUpdate()`); identical to the already-merged fix in `question-picker.ts`.

## Context

Four Lit components set reactive state inside `updated()`, which runs after the render phase. Setting reactive properties in `updated()` schedules an additional render cycle — the source of the Lit dev-mode warning "Element X scheduled an update after an update completed."

The fix in each case is to move synchronous state derivation to `willUpdate()`, which runs **before** `render()` and is the correct Lit hook for computing reactive state from changed properties. Async continuations (after `await`) are legitimate data-driven renders and do not require change.

Task 011 already applied this pattern to `question-picker.ts`. These four remain:

| Component | File | `updated()` violation |
|---|---|---|
| `widget-editor` | `src/features/dashboard/ui/widget-editor/widget-editor.ts:117` | synchronously sets `_panelConfig` when `widget` changes |
| `datasource-editor` | `src/features/datasource/ui/datasource-editor/datasource-editor.ts:49` | calls async `_loadConfig()` (sync reset `_loadError = ''`) when `slug`/`isNew` changes |
| `question-editor` | `src/features/question/ui/question-editor/question-editor.ts:48` | calls async `_loadConfig()` (sync reset `_error = ''`) when `slug`/`isNew` changes |
| `datasource-picker` | `src/features/datasource/ui/datasource-picker/datasource-picker.ts:30` | synchronously sets `_filter` and `_pendingSlugs` when `open` changes |

## Use Cases

- **Feature**: Lit component lifecycle correctness
- **Scenario**: Developer opens the app in dev mode
- **Given** the app runs with Lit dev mode enabled
- **When** any of the four components renders due to a property change
- **Then** no "scheduled an update after an update completed" warning appears in the console

## Definition of Ready

- All four component files and their spec files are available.
- Task 011 pattern (`willUpdate()` for sync resets, `updated()` for DOM side-effects and fire-and-forget async) is documented and merged.
- Lit `willUpdate(changedProperties)` lifecycle is available in all four components.

## Functional Requirements

- `FR-001`: `widget-editor` derives `_panelConfig` from `widget` in `willUpdate()`, not `updated()`.
- `FR-002`: `datasource-editor` resets sync state (`_loadError = ''`, `_isDirty = false`, `_nameError = ''`, `_urlError = ''`) in `willUpdate()` when `slug` or `isNew` changes; the async `_loadConfig()` call remains in `updated()`.
- `FR-003`: `question-editor` resets sync state (`_error = ''`, `_isDirty = false`) in `willUpdate()` when `slug` or `isNew` changes; the async `_loadConfig()` call remains in `updated()`.
- `FR-004`: `datasource-picker` resets `_filter` and `_pendingSlugs` in `willUpdate()` when `open` changes; the async `_loadItems()` call remains in `updated()`.
- `FR-005`: No observable behavior change for end users: data still loads, editors still pre-fill, picker still resets on open.

## Non-Functional Requirements

- `NFR-001`: Zero "scheduled an update after an update completed" warnings in Lit dev mode for all four components after the fix.
- `NFR-002`: Each component fix is constrained to its own file; no cross-component refactoring.

## Observability Requirements

- `OBS-001`: Not applicable — this task removes spurious render cycles and does not add or change any log, metric, or trace.

## Acceptance Criteria

- `AC-001`: **Given** `widget-editor` receives a new `widget` prop, **When** it renders, **Then** `_panelConfig` is set before `render()` runs (no extra render cycle).
- `AC-002`: **Given** `datasource-editor` receives a new `slug`, **When** it renders, **Then** the sync state resets happen in `willUpdate()` before `render()`.
- `AC-003`: **Given** `question-editor` receives a new `slug`, **When** it renders, **Then** the sync state resets happen in `willUpdate()` before `render()`.
- `AC-004`: **Given** `datasource-picker` has `open` set to `true`, **When** it renders, **Then** `_filter` and `_pendingSlugs` are reset in `willUpdate()` before `render()`.
- `AC-005`: **Given** any of the four components in Lit dev mode, **When** a property change triggers a render, **Then** no "scheduled an update after an update completed" warning is logged.

## Required Tests

### Unit Tests

- `UT-001`: `widget-editor` — when `widget` changes, `_panelConfig` reflects the new widget config synchronously before the next render. Covers `FR-001`, `AC-001`.
- `UT-002`: `datasource-editor` — when `slug` changes, sync fields (`_isDirty`, `_nameError`, `_urlError`) are reset; the async load is triggered. Covers `FR-002`, `AC-002`.
- `UT-003`: `question-editor` — when `slug` changes, `_isDirty` is reset; the async load is triggered. Covers `FR-003`, `AC-003`.
- `UT-004`: `datasource-picker` — when `open` changes to `true`, `_filter` is empty string and `_pendingSlugs` mirrors `selectedSlugs`. Covers `FR-004`, `AC-004`.

### Integration Tests

Not applicable — each fix is confined to a single component's lifecycle; no service or repository boundary is crossed.

### Smoke Tests

Not applicable — no deploy-path or startup behavior changed.

### End-to-End Tests

Not applicable — no user-visible behavior changes; the fix eliminates internal redundant render cycles only.

### Regression Tests

Not applicable — there is no known user-reported defect tied to the warning; the fix is a dev-mode correctness improvement.

### Performance Tests

Not applicable — the fix reduces unnecessary render cycles; no measurable SLA is at risk.

### Security Tests

Not applicable — no trust boundary, authentication, or authorization changed.

### Usability Tests

Not applicable — no user-visible state or interaction changes.

### Observability Tests

Not applicable — no telemetry added or changed.

## Definition of Done

- `willUpdate()` added (or extended) in all four components.
- Synchronous reactive state assignments moved from `updated()` to `willUpdate()` in all four components.
- `UT-001` through `UT-004` pass.
- No existing tests broken.
- Lit dev-mode warning no longer appears for any of the four components.
