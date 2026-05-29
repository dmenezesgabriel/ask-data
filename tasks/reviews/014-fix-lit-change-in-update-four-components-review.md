---
id: "014"
issue: "tasks/issues/014-fix-lit-change-in-update-four-components.md"
created: 2026-05-28
updated: 2026-05-28
---

# Review: Fix Lit "change-in-update" scheduling warning on four components

## Related Task

- `tasks/issues/014-fix-lit-change-in-update-four-components.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | Non-blocking | UT-002, UT-003 | Issue spec says "the async load is triggered" as part of UT-002 and UT-003, but neither test spies on `getDatasource.execute` or `_loadConfig` to assert the call was made. Sync reset assertions satisfy AC-002/AC-003; the missing assertion is a gap between the test description and the actual coverage. | `datasource-editor.spec.ts` (no spy on execute); `question-editor.spec.ts` (no spy on execute) |
| F-002 | Suggestion | UT-004 | UT-004 asserts `_filter` and `_pendingSlugs` reset but does not assert `_loading = true` or `_error = ''`, even though both were correctly moved to `willUpdate()` per the implementation (beyond FR-004 minimum). A short additional assertion would document the full `willUpdate()` contract. | `datasource-picker.spec.ts` lines verify `_filter`/`_pendingSlugs` only |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | `widget-editor.ts`: `updated()` renamed to `willUpdate()` — `_panelConfig` is now set before `render()`. UT-001 verifies the value matches the new widget before any async side-effect. |
| AC-002 | Pass | `datasource-editor.ts`: `willUpdate()` added with all four sync resets (`_loadError`, `_isDirty`, `_nameError`, `_urlError`); resets removed from `_loadConfig()`. UT-002 verifies all four fields are empty/false after a slug change. |
| AC-003 | Pass | `question-editor.ts`: `willUpdate()` added with `_error = ''` and `_isDirty = false`; resets removed from `_loadConfig()`. UT-003 verifies both fields after a slug change. |
| AC-004 | Pass | `datasource-picker.ts`: `willUpdate()` resets `_filter = ''` and `_pendingSlugs = [...this.selectedSlugs]` when `open` becomes `true`. UT-004 verifies both values after setting `open = true`. |
| AC-005 | Pass | No reactive property assignments remain in any `updated()` handler for the four components. Vitest run of all four spec files emits no "scheduled an update after an update completed" warning — only the expected "Lit is in dev mode" notice. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present | `src/features/dashboard/ui/widget-editor/widget-editor.spec.ts` — asserts `_panelConfig.title` matches new widget before next render. |
| Unit (UT-002) | Present | `src/features/datasource/ui/datasource-editor/datasource-editor.spec.ts` — asserts all four sync fields reset on slug change. Async load not spy-verified (see F-001). |
| Unit (UT-003) | Present | `src/features/question/ui/question-editor/question-editor.spec.ts` — asserts `_isDirty` and `_error` reset on slug change. Async load not spy-verified (see F-001). |
| Unit (UT-004) | Present | `src/features/datasource/ui/datasource-picker/datasource-picker.spec.ts` — asserts `_filter = ''` and `_pendingSlugs` mirrors `selectedSlugs` on `open = true`. |
| Integration | Not applicable | Each fix is confined to a single component's lifecycle; no service or repository boundary is crossed. |
| Smoke | Not applicable | No deploy-path or startup behavior changed. |
| E2E | Not applicable | No user-visible behavior changes. |
| Regression | Not applicable | No known user-reported defect tied to the warning. |
| Performance | Not applicable | Fix reduces unnecessary render cycles; no measurable SLA at risk. |
| Security | Not applicable | No trust boundary, authentication, or authorization changed. |
| Usability | Not applicable | No user-visible state or interaction changes. |
| Observability | Not applicable | No telemetry added or changed. |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 explicitly marked Not applicable).

## ADR Compliance

Not applicable — no ADR dependencies listed in the task. The `willUpdate()` pattern was established in task 011; no new architectural decision was required.

## Convention Notes

- `F-002` — Suggestion — `datasource-picker.spec.ts` could assert `_loading` and `_error` reset inside UT-004 to fully document the `willUpdate()` contract. Not required by FR-004 or AC-004, but the implementation moved these values beyond the minimum and a test gap exists.

## Unresolved Assumptions or Follow-Up

- F-001: If a future regression causes `_loadConfig()` / `_loadItems()` to stop being called on slug/open change, no test would catch it. A follow-up task could add spy assertions to UT-002 and UT-003 to close this gap.
