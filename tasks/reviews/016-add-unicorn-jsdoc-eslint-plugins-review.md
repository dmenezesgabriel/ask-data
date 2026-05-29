---
id: '016'
issue: 'tasks/issues/016-add-unicorn-jsdoc-eslint-plugins.md'
created: 2026-05-29
updated: 2026-05-29
---

# Review: Install eslint-plugin-unicorn and eslint-plugin-jsdoc

## Related Task

- `tasks/issues/016-add-unicorn-jsdoc-eslint-plugins.md`

## Overall Verdict

**Fail**

Blocked by F-001, F-002. Implementer must resolve both Blocking findings before mark-complete.

## Findings

| ID    | Level      | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Evidence                                                                                              |
| ----- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| F-001 | Blocking   | FR-002      | `publicOnly: true` and `checkConstructors: false` absent from jsdoc config. FR-002 requires jsdoc rules to apply to "exported TypeScript functions only (using `checkConstructors: false` and `publicOnly: true` options where supported)." Without `publicOnly: true` in `settings.jsdoc`, `jsdoc/require-description` and `jsdoc/require-example` fire on all functions that have a JSDoc block, including non-exported ones.                                                                                                                                                                                               | `eslint.config.js` lines 207–217: `settings: { jsdoc: { mode: 'typescript' } }` — `publicOnly` absent |
| F-002 | Blocking   | AC-003      | AC-003 requires `jsdoc/require-description` to warn on "an exported function with no JSDoc block." This behavior is structurally impossible for `jsdoc/require-description` — the rule only fires when a JSDoc block already exists but lacks description text. It produces no output for functions with no JSDoc block at all. IT-002 confirmed this (PARTIAL). The implementation correctly noted this as an unresolved assumption, but the AC remains Fail. Resolution: update AC-003 in the issue to reflect that the rule fires on _existing JSDoc blocks lacking description_, not on functions absent any JSDoc block. | `eslint.config.js` line 209; implementation summary IT-002 (PARTIAL)                                  |
| F-003 | Suggestion | —           | `unicorn/prefer-ternary` option differs from the issue spec (`"onlySingleLine"` in the issue vs `"only-single-line"` in the implementation). The implementation uses the kebab-case form required by unicorn v64 — this is correct behavior. The issue spec is what's wrong. Worth updating the issue text for consistency with the actual plugin API so future readers don't copy the wrong option form.                                                                                                                                                                                                                     | `eslint.config.js` line 199; implementation summary note on `only-single-line`                        |
| F-004 | Suggestion | —           | Similarly, the issue spec names `jsdoc/no-blank-block-description` (singular) but the plugin exposes `jsdoc/no-blank-block-descriptions` (plural). The implementation uses the correct plural form. The issue text should be updated to match the actual rule name.                                                                                                                                                                                                                                                                                                                                                           | `eslint.config.js` line 211; implementation summary note on plural form                               |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                         |
| ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | Both plugins installed in `node_modules` and imported in `eslint.config.js` (lines 58, 62). Implementation summary confirms `pnpm lint` ran without `plugin not found` errors.                                                |
| AC-002 | Pass   | `unicorn/no-lonely-if: 'error'` configured at `eslint.config.js` line 197. IT-001 (manual verification) confirmed the rule fires on lonely-if patterns.                                                                       |
| AC-003 | Fail   | See F-002. `jsdoc/require-description` cannot warn on a function with no JSDoc block — it only checks existing JSDoc blocks that lack a description line. The AC text describes behavior the rule is not designed to produce. |
| AC-004 | Pass   | `ignores: ['**/*.stories.ts']` present in the jsdoc config block (`eslint.config.js` line 206). IT-003 (manual verification) confirmed no jsdoc warnings on story files.                                                      |
| AC-005 | Pass   | Both unicorn and jsdoc config blocks use `files: ['src/**/*.ts']`, which excludes `tests/`. No jsdoc or unicorn rules fire on test files.                                                                                     |

## Test Coverage Evaluation

| Test Category        | Status           | Notes                                                                                                                                                                                              |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                 | Not applicable   | Plugin configuration verified by linter runs, not unit tests (per issue).                                                                                                                          |
| Integration (IT-001) | Present (manual) | `unicorn/no-lonely-if` fires on lonely-if pattern. Verified against temp `src/*.ts` file.                                                                                                          |
| Integration (IT-002) | Partial (manual) | `jsdoc/require-description` fires on a JSDoc block with no description, but NOT on a function with no JSDoc block. AC-003 wording is the mismatch; the rule behavior itself is correct. See F-002. |
| Integration (IT-003) | Present (manual) | No jsdoc warnings on `*.stories.ts` files. Verified manually.                                                                                                                                      |
| Smoke                | Not applicable   | No build or deploy path changes.                                                                                                                                                                   |
| E2E                  | Not applicable   | No user journey changes.                                                                                                                                                                           |
| Regression           | Not applicable   | No known previous defect.                                                                                                                                                                          |
| Performance          | Not applicable   | Lint time increase bounded by NFR-001; verified manually (not verifiable from code).                                                                                                               |
| Security             | Not applicable   | No trust boundary changes.                                                                                                                                                                         |
| Usability            | Not applicable   | No user-facing changes.                                                                                                                                                                            |

## Observability Evaluation

| OBS ID  | Requirement                                                                 | Status | Notes                                                                                      |
| ------- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| OBS-001 | `// TODO(lint-debt):` block updated with unicorn and jsdoc violation counts | Met    | Lines 33–41 of `eslint.config.js` document all seven new rules with counts and risk notes. |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- F-003 (Suggestion): Issue spec uses `"onlySingleLine"` (camelCase) for `unicorn/prefer-ternary` but the plugin v64 requires `"only-single-line"` (kebab-case). The implementation is correct; the issue text should be updated.
- F-004 (Suggestion): Issue spec uses `jsdoc/no-blank-block-description` (singular); the plugin exposes `no-blank-block-descriptions` (plural). The implementation uses the correct name; the issue text should be updated.
- Both unicorn and jsdoc config blocks follow the same flat-config `{ files, plugins, rules }` pattern as existing blocks in `eslint.config.js`. No structural convention deviations.

## Unresolved Assumptions or Follow-Up

- **F-001 fix**: Add `publicOnly: true` to `settings.jsdoc` in the jsdoc config block (and `checkConstructors: false` to `jsdoc/require-description` rule options where applicable) to restrict rules to exported functions only as FR-002 requires.
- **F-002 / AC-003 fix**: Update the issue's AC-003 text to read: "Given an exported TypeScript function whose existing JSDoc block has no description text, When ESLint runs, Then `jsdoc/require-description` reports a warning." If enforcing JSDoc presence on all exported functions is a follow-up goal, that requires a separate task to evaluate `jsdoc/require-jsdoc` with `publicOnly: true`.
- **NFR-001** (lint time ≤ 15 s increase): Not verifiable from code. Was measured manually by the implementer. No finding raised — the issue marks Performance tests as Not applicable.
- **Issue text accuracy** (F-003, F-004 Suggestions): The issue should be updated to use the correct plugin option names (`only-single-line`, `no-blank-block-descriptions`) so they match what the plugins actually accept, reducing confusion for future readers.
