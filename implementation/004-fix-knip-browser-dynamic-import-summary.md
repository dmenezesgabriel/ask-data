# Implementation Summary: Fix knip config for browser-context dynamic import

## Related Task
- `issues/004-fix-knip-config-browser-dynamic-import.md`

## Files Changed
- `knip.json` — added `^/src/` to ignoreUnresolved

## Behavior Implemented
- Knip no longer reports a false-positive unresolved import for `/src/infra/db/db.ts` referenced inside a `page.evaluate()` call in `tests/e2e/steps/steps.ts`. The specifier is a Vite dev-server browser URL (starts with `/`), not a Node.js module path, and cannot be statically resolved by knip.
- The pattern `^/src/` suppresses any import specifier beginning with `/src/`, covering all browser-URL dynamic imports issued from `page.evaluate()` contexts.

## Design Notes
- The issue description suggested `/src/**` as the pattern, but knip v6's `toRegexOrString` utility converts strings containing regex metacharacters into `RegExp` objects. The glob `**` expands to `*` in regex context, which causes a "Nothing to repeat" `SyntaxError` because it follows `/` (which is not a quantifiable atom). The regex anchor form `^/src/` is equivalent in intent, avoids the invalid-regex crash, and is more precise (it anchors to the start of the specifier string).
- The existing pattern `tests/.*/steps/.*` in `ignoreUnresolved` matches against import specifier strings (not file paths), but all specifiers from those files were already resolved by knip; the pattern was therefore a no-op, not a path-based filter.

## Tests Added or Updated
- None — static analysis config change.

## Test Categories Not Applicable
- All: Not applicable — static analysis tool configuration, no production logic or test behavior changed.

## Validation Run
`npm run knip` — exits 0 with no output (no unresolved imports reported).

## Accessibility Notes
Not applicable — no UI changes.

## Observability Changes
Not applicable — no runtime behavior changes.

## ADR Updates
Not applicable — no architectural decisions involved.

## Unresolved Assumptions or Follow-Up
- None.
