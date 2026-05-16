# Implementation Summary: Remove dead code — barrel files, shims, and unused exports

## Related Task
- `issues/002-remove-dead-code-barrel-files-and-unused-exports.md`

## Files Changed
- `src/main.ts` — deleted; was a one-line wrapper (`import './app/main'`) never loaded since `index.html` points directly to `src/app/main.ts`
- `src/features/ask/index.ts` — deleted; re-export barrel, never imported by any source, test, or story file
- `src/features/dashboard/index.ts` — deleted; re-export barrel, never imported
- `src/features/datasource/index.ts` — deleted; re-export barrel, never imported
- `src/features/question/index.ts` — deleted; re-export barrel, never imported
- `src/infra/shims/chrono-node/en.ts` — deleted; stub shim exporting `parse() { return [] }`, superseded by real alias in vite.config.ts
- `src/infra/shims/chrono-node/pt.ts` — deleted; same situation as en.ts
- `src/features/dashboard/model/grid-layout-engine.ts` — removed `export function pixelToGrid(...)` (lines 180-192); no callers anywhere in the codebase
- `src/shared/types/data-source.ts` — removed `export interface LegacyDataSourceConfig` (lines 15-18); no callers anywhere in the codebase
- `.storybook/main.ts` — updated `chrono-node/en` and `chrono-node/pt` aliases to point to real chrono-node dist files (`node_modules/chrono-node/dist/esm/locales/{en,pt}/index.js`) instead of the now-deleted shim files

## Behavior Implemented
- All 7 dead files deleted from repository.
- `pixelToGrid` function removed entirely from `grid-layout-engine.ts`.
- `LegacyDataSourceConfig` interface removed entirely from `data-source.ts`.
- Storybook vite aliases for `chrono-node/en` and `chrono-node/pt` updated to point to real dist files (required fix after shim deletion — the shims were in use by `.storybook/main.ts`).

## Design Notes
- The issue stated the shims were "never imported", but `.storybook/main.ts` was aliasing directly to the shim `.ts` files. Deleting the shims without updating the storybook config caused storybook tests to fail. The fix is equivalent: both shims and `vite.config.ts` ultimately resolved to the same real chrono-node dist. The storybook aliases were updated to match `vite.config.ts` behavior, pointing to the real dist files.
- `pixelToGrid` and `LegacyDataSourceConfig` were deleted entirely (not just unexported) since neither had any internal callers.

## Tests Added or Updated
- None — dead code removal, no logic changed.

## Test Categories Not Applicable
- All test categories: Not applicable — dead code removal with no production logic changes.

## Validation Run
`npm run typecheck` — passed, zero errors
`npm run test` — passed: 602 unit, 131 component, 103 storybook, 74 integration, 144 e2e steps all green
`npm run knip` — no longer reports the deleted files or symbols; only pre-existing unrelated issues remain (3 unused deps, 1 unresolved import)

## Accessibility Notes
Not applicable — no UI changes.

## Observability Changes
Not applicable — no runtime behavior changes.

## ADR Updates
Not applicable — no architectural decisions involved.

## Unresolved Assumptions or Follow-Up
- The 3 unused npm dependencies (`@codemirror/search`, `@codemirror/theme-one-dark`, `@lezer/highlight`) and the unresolved import in `tests/e2e/steps/steps.ts` are pre-existing knip findings not in scope for this task.
