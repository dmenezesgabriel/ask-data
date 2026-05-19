# 009 Fix Vite watch crash and dashboard update warning

## What changed

- `vite.config.ts`
  - Ignored `**/.pnpm-store/**` in the Vite dev server watcher so `npm run dev` no longer exhausts file watchers when the local pnpm store exists inside the repo.
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts`
  - Moved dashboard reload logic from `updated()` into `willUpdate()` so the component no longer schedules a second Lit update after an update has already completed.

## Behavior implemented

- The Vite dev server now starts successfully in this repo without the previous `ENOSPC` watcher crash.
- Navigating the dashboard no longer emits the `dashboard-workspace scheduled an update after an update completed` Lit warning.

## Tests and validations run

- `npm run build`
- `npm run dev -- --port 8000`
- Playwright CLI manual runtime check against `http://localhost:8000`
  - opened app
  - opened dashboard view
  - switched to **Ask Data**
  - ran `sales by region`
  - navigated **Questions** and **Datasources**
  - inspected browser console

## Console/runtime results

- Dev server crash fixed.
- Browser console after navigation and Ask Data flow:
  - 0 errors
  - only remaining warning is Lit's normal dev-mode warning (`Lit is in dev mode`), which is expected in Vite dev mode.

## Accessibility checks

- Verified keyboard-independent navigation through standard clickable controls rendered by the existing UI during the Playwright runtime pass.

## ADR updates

- None.

## Intentional non-applicable test categories

- No new unit tests were added because the change is Vite watcher configuration plus Lit lifecycle placement, both validated directly through build and browser runtime behavior.

## Unresolved assumptions or follow-up work

- The DuckDB WASM logs remain verbose in dev mode, but they are informational and not failures.
