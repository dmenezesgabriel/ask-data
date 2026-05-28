---
id: "011"
created: 2026-05-25
updated: 2026-05-25
status: active
---

# Task: Fix Lit scheduling warning in question-picker component

## Priority

P2 — The warning fires every time the "Add from library" dialog opens. It does not break functionality but indicates an inefficient render pattern and may cause visual flicker or missed renders on slow devices.

## Dependencies

- No task dependency; can start concurrently with other tasks.
- No ADR dependency; this is a component-level Lit lifecycle fix.

## Assignability

**AFK** — fully specified with exact line numbers and a known working pattern.

## Context

The `question-picker` component at `src/features/dashboard/ui/question-picker/question-picker.ts` triggers a Lit warning on every dialog open:

```
Element question-picker scheduled an update (generally because a property was set) 
after an update completed, causing a new update to be scheduled.
```

The root cause is in the `updated()` lifecycle method (lines 30–44). When `open` changes to `true`, the method synchronously sets three reactive state properties (`_filter`, `_loading`, `_error`) and calls `_loadItems()` which sets two more (`_loading`, `_error` again). Each assignment schedules a new Lit update cycle, but `updated()` is the post-render phase — setting reactive state here forces Lit to schedule additional updates after the current one has already committed.

### Current code (offending lines)

```typescript
override updated(changed: Map<string, unknown>): void {
  if (changed.has('open')) {
    if (this.open) {
      this._filter = '';          // schedules update #2
      this._loadItems();          // schedules updates #3 and #4
      ...
    }
  }
}

private async _loadItems(): Promise<void> {
  this._loading = true;           // schedules update
  this._error = '';               // schedules update
  try {
    this._items = await ...;
  } catch (error) {
    this._error = ...;            // schedules update
  } finally {
    this._loading = false;        // schedules update
  }
}
```

The fix is to move the synchronous state resets into `willUpdate()`, which runs *before* `render()` and is the correct place to set reactive state based on property changes. The async `_loadItems()` call stays in `updated()` (or in `willUpdate()` as a fire-and-forget), but the initial `_loading = true` flag is set in `willUpdate()` so it's ready when `render()` runs.

This aligns with the Lit guidance: `willUpdate()` for computing state derived from changed properties, `updated()` for DOM side-effects (refs, measurements).

## Use Cases

- **Feature**: Dashboard widget library picker
- **Scenario**: User opens the Add from library dialog
- **Given** a user is editing a dashboard
- **When** the user clicks "+ From library"
- **Then** the dialog opens immediately with a loading state, then displays available questions
- **And** no runtime warning is emitted in the browser console

## Definition of Ready

- The exact lines causing the warning are identified (lines 30–44 and 61–71 of `question-picker.ts`).
- The Lit `willUpdate()` lifecycle method is available and suitable for this use case.

## Functional Requirements

- `FR-001`: When `open` transitions from `false` to `true`, the internal state properties (`_filter`, `_loading`, `_error`) must be reset before `render()` executes, not after.
- `FR-002`: The async `_loadItems()` call may be triggered from `updated()` but must not set `_loading` or `_error` synchronously before `render()` has rendered the initial state.
- `FR-003`: The dialog `showModal()` and `close()` calls must continue to work correctly.

## Non-Functional Requirements

- `NFR-001`: No Lit scheduling warnings must be emitted for this component during normal operation.
- `NFR-002`: The component must render the loading state on the first paint when opening (no flash of empty content).

## Observability Requirements

- `OBS-001`: Not applicable — this task fixes a static code warning; no new runtime telemetry is needed.

## Acceptance Criteria

- `AC-001`: **Given** the app is running, **When** the user opens the "Add from library" dialog, **Then** no Lit scheduling warning is logged to the browser console.
- `AC-002`: **Given** the dialog is open, **When** the questions finish loading, **Then** the list is displayed (loading state transitions to loaded state).
- `AC-003`: **Given** the dialog is open and the user closes it, **Then** the dialog closes cleanly and re-opening shows a fresh state (filter cleared, loading shown).

## Required Tests

### Unit Tests

- `UT-001`: Verify that setting `open = true` causes `_loading` to be `true` and `_filter` to be `''` synchronously (before the next render). Covers `FR-001`.
- `UT-002`: Verify that after `_loadItems()` resolves, `_loading` is `false` and `_items` is populated. Covers `FR-002`.

### Smoke Tests

- `SMK-001`: **Scenario**: Dialog opens without console warning  
  **Given** the app is running  
  **When** the "+ From library" button is clicked  
  **Then** no Lit scheduling warning appears in the console  
  Covers `AC-001`.

### Integration Tests

- `IT-001`: **Scenario**: Dialog open/close lifecycle  
  **Given** a question-picker component  
  **When** `open` is toggled `true → false → true`  
  **Then** the filter is empty and loading is shown on the second open  
  Covers `AC-003`.

### End-to-End Tests

- `E2E-001`: Not applicable — this is a component-internal fix with no user-visible behavior change beyond removing a console warning.

### Regression Tests

- `REG-001`: **Scenario**: Library picker still adds questions to dashboard  
  **Given** a dashboard in edit mode  
  **When** the "+ From library" button is clicked and a question is selected  
  **Then** the question widget is added to the dashboard  
  Covers existing behavior unaffected by the fix.

### Performance Tests

- `PT-001`: Not applicable — the fix removes an unnecessary extra render cycle, improving performance.

### Security Tests

- `ST-001`: Not applicable — no new input, storage, auth, or external communication.

### Usability Tests

- `UX-001`: Not applicable — no user-facing behavior change.

### Observability Tests

- `OT-001`: Not applicable — no runtime telemetry change.

## Definition of Done

- `question-picker.ts` `updated()` no longer sets reactive state properties.
- Synchronous state resets for `_filter`, `_loading`, and `_error` on open moved to `willUpdate()`.
- `_loadItems()` still kicks off asynchronously but the loading flag is set before render.
- No Lit scheduling warning in the console when the dialog opens.
- All required tests pass.
