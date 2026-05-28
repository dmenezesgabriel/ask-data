---
id: '012'
task: "Fix post-create dashboard navigation stuck on 'Loading dashboard...'"
date: 2026-05-28
status: complete
---

## Files Changed

- `src/app/shell/app-shell.ts` — removed `isNew: true` from `_navigate` call in `_onDashboardCreate()` (line 92)
- `src/app/shell/app-shell.spec.ts` — new file with `UT-001` unit test

## Behavior Implemented

- `FR-001` / `AC-001`: After creating a dashboard, the shell now navigates to `#/dashboard/<slug>` without the `new/` segment.
- `FR-002` / `AC-002`: The editor follows the normal load path (fetch from storage), so it shows the persisted dashboard title instead of "Loading dashboard...".
- `FR-003` / `AC-003`: Direct navigation to `#/dashboard/<slug>` is unaffected (no regression).

## Tests Added

- `UT-001` in `src/app/shell/app-shell.spec.ts`: stubs `container.createDashboard`, calls `_onDashboardCreate`, asserts `window.location.hash` equals `#/dashboard/<slug>` and does not contain `new`.

## Validations Run

- `vitest run --project components src/app/shell/` — 2 tests pass (smoke + UT-001)

## Accessibility Checks

Not applicable — no UI states added or changed.

## ADRs Updated

None — routing logic change, no architectural assumption changed.

## Intentionally Not Applicable Test Categories

- Integration, Smoke, E2E, Regression (beyond UT-001), Performance, Security, Usability, Observability — as documented in the task.

## Unresolved Assumptions

None.
