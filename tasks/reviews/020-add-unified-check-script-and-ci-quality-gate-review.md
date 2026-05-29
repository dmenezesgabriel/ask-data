---
id: '020'
issue: 'tasks/issues/020-add-unified-check-script-and-ci-quality-gate.md'
created: 2026-05-29
updated: 2026-05-29
---

# Review: Add unified check script and CI quality gate

## Related Task

- `tasks/issues/020-add-unified-check-script-and-ci-quality-gate.md`

## Overall Verdict

**Pass**

No Blocking findings. Two Non-blocking findings (F-001, F-002) and one Suggestion (F-003) must be addressed or accepted before the task is closed.

## Findings

| ID    | Level        | Requirement      | Description                                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                 |
| ----- | ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| F-001 | Non-blocking | FR-003 / OBS-001 | `quality.yml` runs individual named steps per tool (`pnpm typecheck`, `pnpm lint`, …) instead of a single `pnpm check` call as FR-003 specified. This creates a maintenance gap: additions to the `check` script must be manually mirrored in `quality.yml`. The choice correctly satisfies OBS-001, but FR-003 and OBS-001 are in conflict and that conflict is not documented in the implementation summary. | `.github/workflows/quality.yml:19–33`                                    |
| F-002 | Non-blocking | IT-001, IT-002   | The implementation summary's "Validations run" section does not include IT-001 or IT-002. The DoD explicitly requires "IT-001 and IT-002 pass locally." The `&&` chain makes IT-002 (fail-fast on lint error) logically verifiable from code, but IT-001 (full `pnpm check` exits 0 on clean codebase) requires an actual run. No documented evidence that run occurred.                                       | `tasks/implementation/020-…md` — Validations section omits IT-001/IT-002 |
| F-003 | Suggestion   | FR-003           | FR-003 described `pnpm install --frozen-lockfile` as an explicit step in `quality.yml`. The implementation moved it into the `setup-node` composite action instead, which is better (NFR-002 now applies to `publish.yml` too), but the install is no longer visible as a named step in the `quality.yml` step list. Worth documenting the deliberate choice.                                                  | `.github/workflows/setup-node/action.yml:19`                             |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                               |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `check` script in `package.json:31` chains all seven tools with `&&`; exact string matches FR-001.                                                                  |
| AC-002 | Pass   | `&&` chain short-circuits on first non-zero exit; lint failure stops execution before `duplication:check` and `architecture:check`.                                 |
| AC-003 | Pass   | `quality.yml` triggers on `push` and `pull_request` to `master`, runs on `ubuntu-latest`, uses `setup-node`. See F-001 for step-structure deviation (non-blocking). |
| AC-004 | Pass   | `grep -rn '\bnpm run\b' .husky/ package.json` returns no output. All references are `pnpm run`.                                                                     |
| AC-005 | Pass   | `deps:check` in `package.json:30` is `"pnpm knip"` — identical exit code to `pnpm knip`.                                                                            |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                        |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Unit                 | Not applicable | Issue states: script wiring is verified by running commands, not unit tests.                                                 |
| Integration (IT-001) | Not documented | No formal test file; manual run expected. DoD requires it pass locally — not evidenced in implementation summary. See F-002. |
| Integration (IT-002) | Not documented | Same as IT-001. Fail-fast behavior is logically guaranteed by `&&` chain, but execution was not recorded. See F-002.         |
| Smoke (SMK-001)      | Pending        | Implementation explicitly defers to post-merge push to `master`. Acceptable per task spec.                                   |
| E2E                  | Not applicable | Issue states: no user-facing behavior changes.                                                                               |
| Regression           | Not applicable | Issue states: no known prior defect.                                                                                         |
| Performance (PT-001) | Not run        | Implementation notes hardware/OOM risk; deferred. Acceptable per task spec.                                                  |
| Security             | Not applicable | Issue states: no trust boundary changes, no secrets required.                                                                |
| Usability            | Not applicable | Issue states: no user-facing behavior changes.                                                                               |
| Observability        | Not applicable | Issue states: check script's console output is its own observability.                                                        |

## Observability Evaluation

| OBS ID  | Requirement                                                          | Status | Notes                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS-001 | CI step names explicit so GitHub Actions UI shows which check failed | Met    | Steps named: `Run typecheck`, `Run lint`, `Run format check`, `Run fast tests`, `Run knip`, `Run duplication check`, `Run architecture check`. All seven checks individually visible. |
| OBS-002 | `pnpm check` output human-readable; each tool prints its own summary | Met    | Each tool (`tsc`, `eslint`, `prettier`, `vitest`, `knip`, `jscpd`, `depcruise`) produces its own summary. Overall exit code signals pass/fail.                                        |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-001` — Non-blocking — `quality.yml` diverges from the pattern suggested by FR-003 (single `pnpm check`) in favor of OBS-001 (individual named steps). Comparable workflows in the repo (`publish.yml`) use single-command steps. The deviation is intentional and observability-beneficial, but the conflict between FR-003 and OBS-001 should be resolved by updating FR-003 in any follow-up task or ADR so future workflows know which pattern to follow.
- `F-003` — Suggestion — Moving install into `setup-node` is a cleaner pattern that other workflows can reuse, but differs from the step structure FR-003 described. Worth a one-line note in the `setup-node` action or implementation summary to prevent confusion when future contributors read FR-003 alongside the workflow.

## Unresolved Assumptions or Follow-Up

- **SMK-001 not yet verified**: CI smoke test pending first push to `master`. If the composite `setup-node` action path (`./.github/workflows/setup-node`) resolves correctly under GitHub Actions (not just locally), SMK-001 will pass. Existing `publish.yml` already uses the same path, so this is low risk.
- **PT-001 not measured**: Wall-clock time under 5 minutes (NFR-001) not verified on this machine due to OOM risk. CI runner (`ubuntu-latest`) has sufficient RAM; PT-001 is expected to pass there.
- **FR-003 / OBS-001 conflict**: The requirement conflict (single `pnpm check` step vs. individual named steps) is resolved correctly in the implementation, but neither the issue nor the implementation summary documents the resolution. A follow-up note or ADR clarifying the canonical CI workflow pattern would prevent drift.
- **IT-001 gap**: If `pnpm check` on the current codebase exits non-zero (e.g., due to a pre-existing lint baseline issue from tasks 015–016), AC-001 and the task DoD are not satisfied. The implementation does not record the actual exit code from a clean run.
