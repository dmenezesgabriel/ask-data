---
id: '012'
issue: 'tasks/issues/012-fix-post-create-dashboard-navigation.md'
created: 2026-05-28
updated: 2026-05-28
---

# Review: Fix post-create dashboard navigation stuck on "Loading dashboard..."

## Related Task

- `tasks/issues/012-fix-post-create-dashboard-navigation.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                  |
| ----- | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| F-001 | Non-blocking | REG-001     | Regression test `REG-001` is not present as a named test. The hash assertion ("does not contain `/new/`") is fulfilled by `UT-001`, but the second assertion ("editor renders the dashboard title instead of 'Loading dashboard...'") is not verified at any test level. Integration and E2E tests are both marked N/A in the issue, making the rendering check impractical at the unit level. | `src/app/shell/app-shell.spec.ts` — no test labeled `REG-001`; rendering assertion absent |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                                           |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `_onDashboardCreate` at `app-shell.ts:92` calls `_navigate({ view: 'editor', slug: dashboard.id })` — no `isNew` property. `routeToHash` for an editor route without `isNew` produces `#/dashboard/<slug>` (confirmed in `hash-routes.ts:editorHash`). UT-001 asserts `window.location.hash === '#/dashboard/q1-sales-abc123'`. |
| AC-002 | Pass   | When `route.isNew` is absent, `_loadDashboardForRoute` (line 73–84) skips the `createEmptyDashboardConfig` branch and calls `container.getDashboard.execute(route.slug)`, fetching the persisted dashboard entity. Code path is correct; runtime rendering is not unit-testable and integration/E2E are N/A per issue.          |
| AC-003 | Pass   | No changes to `_hashChangeHandler`, `parseHash`, or any direct-navigation code path. `parseHash('#/dashboard/<slug>')` continues to return `{ view: 'editor', slug: '<slug>' }` without `isNew`. Existing `SMK-001` in `app-shell.smoke.spec.ts` provides a shell-startup regression guard.                                     |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                                                                                                                     |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present        | `src/app/shell/app-shell.spec.ts:25` — stubs `container.createDashboard`, calls `_onDashboardCreate`, asserts `window.location.hash === '#/dashboard/q1-sales-abc123'` and `not.toContain('new')`. Covers FR-001, AC-001. |
| Integration          | Not applicable | Issue marks this N/A: fix is inside a client-side Lit component with no service boundary crossed.                                                                                                                         |
| Smoke                | Not applicable | Issue marks this N/A: existing `SMK-001` at `app-shell.smoke.spec.ts:14` covers shell startup; no new shallow-path risk introduced.                                                                                       |
| E2E                  | Not applicable | Issue marks this N/A: dashboard creation journey covered by existing E2E scenarios.                                                                                                                                       |
| Regression (REG-001) | Partial        | Hash assertion covered by UT-001 (`not.toContain('new')`). No test is labeled REG-001; rendering assertion absent. See F-001.                                                                                             |
| Performance          | Not applicable | Issue marks this N/A.                                                                                                                                                                                                     |
| Security             | Not applicable | Issue marks this N/A.                                                                                                                                                                                                     |
| Usability            | Not applicable | Issue marks this N/A.                                                                                                                                                                                                     |
| Observability        | Not applicable | Issue marks this N/A.                                                                                                                                                                                                     |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (`OBS-001` is marked N/A in the issue).

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- The test in `app-shell.spec.ts` uses `beforeEach`/`afterEach` for setup/teardown while `app-shell.smoke.spec.ts` performs teardown inline. Both approaches are acceptable; the spec convention is consistent with the test complexity.
- The issue's `UT-001` description specifies verifying the `_navigate` call arguments. The implementation instead asserts the observable outcome (`window.location.hash`). This is better testing practice (behavior over implementation detail) and satisfies the requirement intent — no finding raised.

## Unresolved Assumptions or Follow-Up

- F-001: If a future task revisits the regression test gap, REG-001's rendering assertion ("editor renders dashboard title") could be covered by a component-level render test (e.g., checking `dashboard-editor` receives the correct `.config.title`). This would require a stub for `container.getDashboard` and a rendered component check — out of scope for this task given the integration/E2E exclusions.
