---
id: '012'
issue: 'tasks/issues/012-typescript-strictness-dead-code-env.md'
created: 2026-05-21
updated: 2026-05-21
---

# Review: TypeScript strictness, dead code removal, and env declaration

## Related Task

- `tasks/issues/012-typescript-strictness-dead-code-env.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                        | Evidence                             |
| ----- | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| F-001 | Suggestion   | FR-005      | `env.d.ts` redeclares `interface ImportMeta { readonly env: ImportMetaEnv }`, which Vite already declares in `types/importMeta.d.ts`. Only the `ImportMetaEnv` augmentation is needed per Vite docs.                                                                               | `src/env.d.ts:9-11`                  |
| F-002 | Suggestion   | FR-001      | The now-empty `src/infra/query/` directory was not removed after deleting `query-port.ts`. Harmless, but leaves dead directory structure.                                                                                                                                          | `src/infra/query/` (empty)           |
| F-003 | Non-blocking | FR-005      | The `mode as string` cast in the runtime warning branch (`app-container.ts:7`) is necessary because TypeScript narrows `mode` to `never` after the type guards, but this is non-obvious. A brief inline note would prevent future readers from removing the cast as "unnecessary". | `src/composition/app-container.ts:9` |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                        |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC-001 | Pass   | `grep -r 'src/infra/query/query-port' src/` returns empty. File deleted; `db.spec.ts` updated to import from `@/core/application/ports`.     |
| AC-002 | Pass   | `grep -r 'class Dashboard extends AppShell' src/` returns empty. Subclass removed; `customElements.define('app-dashboard', AppShell)` added. |
| AC-003 | Pass   | `tsconfig.json` has `"noImplicitAny": true`; `npm run typecheck` exits 0.                                                                    |
| AC-004 | Pass   | `src/env.d.ts` declares `VITE_RUNTIME_MODE?: 'client-only'                                                                                   | 'client-server'`inside`ImportMetaEnv`; TypeScript will autocomplete this union. |
| AC-005 | Pass   | `slugToTitle` defined at module scope (`app-shell.ts:19`), called inside `render()` at line 117. Not inside render any more.                 |

## Test Coverage Evaluation

| Test Category | Status         | Notes                                                                                                                  |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001) | Present        | `src/infra/db/db.spec.ts` — imports `QueryPort` from `@/core/application/ports`, asserts `DuckDBManager` satisfies it. |
| Integration   | Not applicable | All changes are structural/type-level with no cross-boundary interactions (stated in issue).                           |
| Smoke         | Not applicable | No startup or build-path changes beyond `typecheck` passing (stated in issue).                                         |
| End-to-End    | Not applicable | No user-visible behaviour changes (stated in issue).                                                                   |
| Regression    | Not applicable | No known previous defects in these areas (stated in issue).                                                            |
| Performance   | Not applicable | Type changes and dead code removal have no runtime performance impact (stated in issue).                               |
| Security      | Not applicable | No authentication, authorization, or input handling changes (stated in issue).                                         |
| Usability     | Not applicable | No user-visible changes (stated in issue).                                                                             |
| Observability | Not applicable | OBS-001 states no new observability requirements (stated in issue).                                                    |

## Observability Evaluation

Not applicable — `OBS-001` states no new observability requirements.

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- **F-001** — Suggestion — The Vite convention for custom environment variables is to augment only `ImportMetaEnv`, not redeclare `ImportMeta`. The existing `ImportMeta` declaration at `src/env.d.ts:9-11` is redundant but harmless (TypeScript merges identical interface declarations).

- **F-003** — Non-blocking — The `mode as string` cast in `app-container.ts:9` inside the `if (mode && mode !== 'client-only' && mode !== 'client-server')` guard is required because TypeScript narrows `mode` to `never` at that point (the union is exhausted by the `!==` checks). Without the cast, string interpolation would reject `never`. A comment (`// cast needed: TypeScript narrows mode to never after type guards above`) would prevent the next developer from removing it thinking it's a dead branch or unnecessary cast.

## Additional Observations

### baseUrl migration (not in task contract, correctly handled)

Removing `ignoreDeprecations: "6.0"` exposed a pre-existing TS5101 error about `baseUrl` being deprecated in TypeScript 6.x. The implementation correctly resolved this by removing `baseUrl: "."` and updating the `paths` entry from `"@/*": ["src/*"]` to `"@/*": ["./src/*"]`. This change was not required by FR-004 but was a necessary consequence of satisfying NFR-001 (typecheck zero errors). The migration is safe — Vite's `resolve.alias` still maps `@` → `src`, and the tsconfig `paths` change only affects TypeScript type resolution (same logical mapping).

### noUnusedLocals coverage

The implementation correctly addressed all `noUnusedLocals` / `noUnusedParameters` errors across the codebase:

- Removed dead `isNumericType` private method (`semantic-modeling.ts`)
- Removed dead `_syncSheetData` private method (`dashboard-workspace.ts`)
- Renamed unused `summary` parameter to `_summary` in `narrative-generator.ts`
- Removed unused test-scope variables `_countryField`, `_displayLabel`, `_localizedTerms` from `value-filter-resolver.spec.ts`
- Exported `container` from `app-container.ts` (was `const _container` — unused module-level declaration)

### 691 unit tests pass

All pre-existing tests continue to pass after the tsconfig strictness changes. No test skips or assertion changes were needed.

## Unresolved Assumptions or Follow-Up

- The `export const container` in `src/composition/app-container.ts` is flagged as an unused export by `npm run knip`. This is expected: Task 014 ("Activate the composition container") will import and consume this export when wiring `AppShell` to the composition layer. Not a finding for this task.
- `src/adapters/http/http-error.ts` and `ClientServerContainer` type remain flagged by knip — these are pre-existing and outside this task's scope.
- The empty `src/infra/query/` directory (F-002) can be removed in any future housekeeping commit.
