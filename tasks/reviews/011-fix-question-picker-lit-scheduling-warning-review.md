---
id: "011"
issue: "tasks/issues/011-fix-question-picker-lit-scheduling-warning.md"
created: 2026-05-28
updated: 2026-05-28
---

# Review: Fix Lit scheduling warning in question-picker

## Related Task

- `tasks/issues/011-fix-question-picker-lit-scheduling-warning.md`

## Overall Verdict

**Fail**

Blocked by F-001, F-002. Implementer must resolve both Blocking findings before mark-complete.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | Blocking | SMK-001 | Smoke test for absence of Lit scheduling warning is entirely absent. No `console.warn` spy or equivalent assertion exists in the spec. | `src/features/dashboard/ui/question-picker/question-picker.spec.ts` — no SMK-001 test |
| F-002 | Blocking | REG-001 | Regression test for "library picker still adds questions to dashboard" is absent. Neither the unit spec nor any E2E feature file includes a test for the `question-attach` event or the full add-to-dashboard flow. | `src/features/dashboard/ui/question-picker/question-picker.spec.ts`, `tests/e2e/features/dashboard-workspace.feature` — no REG-001 test |
| F-003 | Suggestion | UT-001 | The test asserts post-update internal state (`_loading`, `_filter`) via cast-to-internals rather than observable render output (e.g., loading text visible in DOM). Both approaches are valid, but a DOM assertion would verify FR-001's "before render" requirement more directly without relying on private state access. | `src/features/dashboard/ui/question-picker/question-picker.spec.ts:77–79` |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | The structural fix moves all synchronous reactive-state resets from `updated()` into `willUpdate()`. The extra post-render update cycles that triggered the warning are eliminated. Implementation summary confirms the warning is absent from test console output. Formal verification via SMK-001 is still missing (see F-001). |
| AC-002 | Pass | UT-002 asserts `_loading === false` and `_items.length === 1` after `setTimeout(0)` + `updateComplete` flush — confirms the loaded state transition. |
| AC-003 | Pass | IT-001 sets `_filter = 'something'`, closes, and re-opens; asserts `_filter === ''` and `_loading === true` on the second open. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present | `src/features/dashboard/ui/question-picker/question-picker.spec.ts` — `willUpdate() — state reset on open` describe block |
| Unit (UT-002) | Present | `src/features/dashboard/ui/question-picker/question-picker.spec.ts` — `_loadItems() — async resolution` describe block |
| Smoke (SMK-001) | Missing | No `console.warn` spy or browser-console assertion added. The issue does not mark this as Not applicable. See F-001. |
| Integration (IT-001) | Present | `src/features/dashboard/ui/question-picker/question-picker.spec.ts` — `IT-001: open → close → open lifecycle` describe block |
| E2E (E2E-001) | Not applicable | Per issue: no user-visible behavior change beyond removing a console warning. |
| Regression (REG-001) | Missing | No test covers the `question-attach` event dispatch on item selection, nor the end-to-end "add from library to dashboard" flow. `tests/e2e/features/dashboard-workspace.feature` has no "+ From library" scenario. See F-002. |
| Performance (PT-001) | Not applicable | Per issue: fix removes an extra render cycle, improving performance. |
| Security (ST-001) | Not applicable | Per issue: no new input, storage, auth, or external communication. |
| Usability (UX-001) | Not applicable | Per issue: no user-facing behavior change. |
| Observability (OT-001) | Not applicable | Per issue: no runtime telemetry change. |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 marked Not applicable in the issue).

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-003` — Suggestion — UT-001 uses private-state casting (`el as unknown as PickerInternals`) to verify `_loading` and `_filter`. This pattern is consistent with the rest of the spec file and is idiomatic for Lit component unit tests in this codebase. The suggestion to assert on DOM output instead is strictly optional.

## Unresolved Assumptions or Follow-Up

- **SMK-001 implementation path**: The most viable approach is a vitest test that spies on `console.warn`, opens the component, awaits `updateComplete` twice (once for `willUpdate`/`render`/`updated`, once for the `_loadItems()` async result), and asserts the spy was not called with a string matching `'scheduled an update'`. This keeps it in the existing vitest/jsdom context without needing the browser.
- **REG-001 scope**: The `_onSelect()` method was not touched by this fix and the `question-attach` event dispatch is straightforward to unit-test. A minimal REG-001 can be added as a unit test that mounts the picker, opens it, waits for items to load, clicks an item button, and asserts the `question-attach` CustomEvent was dispatched with the correct detail. A full dashboard E2E scenario is not required unless the issue intended that; the unit-level coverage would satisfy the regression intent.
- The implementation summary notes that `widget-editor`, `datasource-editor`, and `question-editor` emit the same Lit scheduling warning. These are pre-existing issues outside task 011 scope.
