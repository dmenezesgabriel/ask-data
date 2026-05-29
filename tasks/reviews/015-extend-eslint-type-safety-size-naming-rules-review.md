---
id: '015'
issue: 'tasks/issues/015-extend-eslint-type-safety-size-naming-rules.md'
created: 2026-05-29
updated: 2026-05-29
---

# Review: Extend ESLint with type-safety, size, naming, and control-flow rules

## Related Task

- `tasks/issues/015-extend-eslint-type-safety-size-naming-rules.md`

## Overall Verdict

**Fail** — Blocked by F-001. Implementer must resolve F-001 before mark-complete.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                                                                       | Evidence                                                                                                  |
| ----- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| F-001 | Blocking     | NFR-001     | `pnpm lint` takes ~90 seconds on the full `src/` tree, exceeding the 60-second target by ~50%. The root cause is `projectService: true` (required by FR-001's `no-unsafe-*` rules), whose overhead was not anticipated in the NFR. Mitigation: `eslint --cache` reduces subsequent runs; the first run remains over budget.                                                                                                                       | Implementation summary: "Lint timing: ~90 seconds... over NFR-001's 60s target"                           |
| F-002 | Non-blocking | DoD         | Definition of Done states "Code is implemented in `eslint.config.js` only; no other source files are refactored," but 18 source files were modified with `import type` auto-fixes. FR-007 explicitly permits fixing low-risk violations (including `consistent-type-imports`), creating a direct contradiction between the DoD and FR-007. The implementation chose FR-007 (the functional requirement).                                          | `src/features/ask/model/date-range-parser.ts`, `field-search.ts`, `intent-cue-detector.ts`, and 15 others |
| F-003 | Non-blocking | IT-002      | `pnpm lint` runs only on `src/` (confirmed: `"lint": "eslint src"`), so IT-002's scenario ("console.log in `tests/`, When pnpm lint runs, Then no error") cannot be verified end-to-end via the standard lint script. The `tests/**` override IS present and correct in the config, but IT-002 is only verifiable by running `eslint tests/` directly, which was not documented in the implementation summary.                                    | `eslint.config.js:155–160`; `package.json` lint script                                                    |
| F-004 | Suggestion   | FR-005      | Spec files collocated under `src/` (e.g., `src/features/**/*.spec.ts`, `src/composition/**/*.spec.ts`) are not covered by the `tests/**` no-console override. These files are included in `pnpm lint`'s scope. Currently no spec file under `src/` uses `console.log`, but adding one would produce a lint error without an obvious path to suppress it per project convention. Consider adding a `**/*.spec.ts` glob to the no-console override. | `eslint.config.js:155–160`; confirmed by `grep console src/**/*.spec.ts` (no current violations)          |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                             |
| ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| AC-001 | Pass   | `eslint.config.js` has a populated `// TODO(lint-debt):` block; all new rules are present and active; lint exits non-zero only for violations enumerated in that block                                                            |
| AC-002 | Pass   | Both `@typescript-eslint/no-explicit-any: 'error'` and `@typescript-eslint/explicit-function-return-type: ['error', { allowExpressions: true }]` are present in the `**/*.ts, **/*.tsx` config block (`eslint.config.js:125–126`) |
| AC-003 | Pass   | `no-console: 'error'` is applied globally (`eslint.config.js:151`); `src/core/` has no explicit override, so console usage there would fire the rule                                                                              |
| AC-004 | Pass   | `tests/**` override sets `no-console: 'off'` (`eslint.config.js:156`); the `tests/e2e/steps/world.ts` file uses console methods and would be exempt                                                                               |
| AC-005 | Pass   | `complexity: ['error', 8]` is present (`eslint.config.js:142`); ESLint fires when cyclomatic complexity exceeds 8, i.e., a function with 9 branches would trigger it                                                              |
| AC-006 | Pass   | No new `// eslint-disable` directives introduced; the 3 pre-existing directives in `app-shell.spec.ts`, 1 in `question-parser.ts`, and 2 in `sql-planner.ts` exist identically in `HEAD` — confirmed by `git show HEAD:<file>     | grep eslint-disable` |

## Test Coverage Evaluation

| Test Category          | Status            | Notes                                                                                                                                                                                                 |
| ---------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                   | Not applicable    | Issue: "ESLint rule configuration is verified by running the linter against the real source tree, not by unit tests of config logic"                                                                  |
| Integration (IT-001)   | Present           | Verified manually: `pnpm lint` was run; violation counts are documented in the `// TODO(lint-debt):` block; no rules are silently overridden                                                          |
| Integration (IT-002)   | Present (partial) | The `tests/**` override is present and correct. However, the standard `pnpm lint` script does not cover `tests/`; IT-002 can only be fully verified by running `eslint tests/` separately — see F-003 |
| Smoke                  | Not applicable    | No build or deploy path changes                                                                                                                                                                       |
| E2E                    | Not applicable    | No user journey changes                                                                                                                                                                               |
| Regression             | Not applicable    | No known previous defect                                                                                                                                                                              |
| Performance            | Not applicable    | Issue marks this not applicable                                                                                                                                                                       |
| Security               | Not applicable    | Issue marks this not applicable                                                                                                                                                                       |
| Usability              | Not applicable    | No user-facing behavior changes                                                                                                                                                                       |
| Observability (OT-001) | Present           | `// TODO(lint-debt):` block exists at top of `eslint.config.js` with rule names, violation counts, and risk levels                                                                                    |

## Observability Evaluation

| OBS ID  | Requirement                                                                                               | Status | Notes                                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS-001 | `// TODO(lint-debt):` block in `eslint.config.js` lists each new rule with violation count and risk level | Met    | Block present at `eslint.config.js:1–42`; covers all 7 new TS rules, 5 size/naming rules, sonarjs side-effect rules, and pre-existing violations; each entry has count and risk label |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- F-002 — Non-blocking — The `import type` auto-fixes applied across 18 files are semantically correct (all imports were type-only) and follow the `consistent-type-imports` rule the task itself introduced. The DoD/FR-007 tension is a wording issue in the task contract, not a convention violation. No convention remediation needed.
- F-004 — Suggestion — Adding `**/*.spec.ts` to the `no-console` override block (`eslint.config.js:156`) would eliminate the gap for collocated spec files and prevent unexpected lint errors as the test suite evolves.

## Unresolved Assumptions or Follow-Up

- **NFR-001 mitigation path**: Adding `eslint --cache` to the lint script would reduce repeated runs to near-zero overhead after the first warm run. First run would still exceed 60 seconds on this hardware (i5-1135G7, 7GB RAM). If the target must be met cold, the only alternative is disabling `projectService` and dropping the `no-unsafe-*` rules — which would require reverting FR-001 partially.
- **IT-002 explicit verification**: Run `eslint tests/` (or `eslint tests/e2e/steps/world.ts`) and confirm zero `no-console` errors. This verifies the override works end-to-end and would close F-003.
- **813 sonarjs/deprecation violations**: Documented in lint-debt; requires removing deprecated internal type aliases. Medium-effort follow-up task.
- **441 max-lines-per-function violations**: High-risk split left for dedicated follow-up tasks per FR-007.
- **111 explicit-function-return-type violations**: Left for follow-up per FR-007.
