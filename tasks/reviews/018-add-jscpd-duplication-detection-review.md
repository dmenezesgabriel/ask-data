---
id: '018'
issue: 'tasks/issues/018-add-jscpd-duplication-detection.md'
created: 2026-05-29
updated: 2026-05-29
---

# Review: Add jscpd for copy-paste duplication detection

## Related Task

- `tasks/issues/018-add-jscpd-duplication-detection.md`

## Overall Verdict

**Fail**

Blocked by F-001. The `pnpm-lock.yaml` was not updated when `jscpd` was installed, so a fresh `pnpm install` in CI will not install the package and `pnpm duplication:check` will fail. Implementer must resolve F-001 before mark-complete.

## Findings

| ID    | Level      | Requirement  | Description                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidence                              |
| ----- | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| F-001 | Blocking   | FR-001 / DoD | `pnpm-lock.yaml` has no entry for `jscpd` (0 grep hits). `jscpd` was installed via `npm install --save-dev`, which updated `package-lock.json` but not `pnpm-lock.yaml`. On a clean checkout, `pnpm install` will not install jscpd; `pnpm duplication:check` will exit with "command not found". The DoD requires "jscpd is in devDependencies **and installed**" — the pnpm lockfile omission breaks the "installed" condition in CI. | `pnpm-lock.yaml` — 0 hits for "jscpd" |
| F-002 | Suggestion | FR-004       | The `.gitignore` entry `reports/duplication` (line 9) is redundant — the parent `reports` entry on line 8 already covers all content under `reports/`. FR-004 explicitly required this line for explicitness, so adding it was correct, but it can be cleaned up in a future housekeeping pass with no functional impact.                                                                                                               | `.gitignore` lines 8–9                |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                    |
| ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `threshold: 1` in `.jscpd.json` produces deterministic exit-1 when duplication exceeds 1%. Implementation summary confirms consistent exit (1, above threshold). AC accepts exit 0 or 1. |
| AC-002 | Pass   | `reporters: ["console", "html"]` and `output: "reports/duplication"` configured. Implementation summary confirms `reports/duplication/html/index.html` generated.                        |
| AC-003 | Pass   | `.gitignore` has `reports/duplication` at line 9 (explicit per FR-004) in addition to the parent `reports` entry at line 8.                                                              |
| AC-004 | Pass   | `.jscpd.json` `ignore` array includes `.stryker-tmp/**`. Implementation summary confirms no `.stryker-tmp/` files appeared in the report (IT-002 verified).                              |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                                                                     |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                 | Not applicable | Per issue: verified by running the tool against real source files.                                                                                                        |
| Integration (IT-001) | Present        | Manually verified: `npm run duplication:check` exits 1, console shows percentage summary, `reports/duplication/html/index.html` generated. Covers FR-003, AC-001, AC-002. |
| Integration (IT-002) | Present        | Manually verified: no `.stryker-tmp/` files in report. Covers FR-002, AC-004.                                                                                             |
| Smoke                | Not applicable | No application startup path changes.                                                                                                                                      |
| E2E                  | Not applicable | No user journey changes.                                                                                                                                                  |
| Regression           | Not applicable | No known previous defect.                                                                                                                                                 |
| Performance          | Not applicable | Runtime bounded by NFR-001, verified manually (completed in under 60s).                                                                                                   |
| Security             | Not applicable | No trust boundary changes.                                                                                                                                                |
| Usability            | Not applicable | No user-facing behavior changes.                                                                                                                                          |
| Observability        | Not applicable | Duplication reporting is the tool's own output artifact.                                                                                                                  |

## Observability Evaluation

| OBS ID  | Requirement                                                                   | Status | Notes                                                                                                                             |
| ------- | ----------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| OBS-001 | HTML report at `reports/duplication/` with file-level and block-level details | Met    | `reporters: ["console", "html"]` + `output: "reports/duplication"` in `.jscpd.json`. Report generated per implementation summary. |
| OBS-002 | Baseline duplication percentage recorded in `.jscpd.json` as a comment        | Met    | `"//": ["Baseline duplication (2026-05-29): 5.01% total (typescript: 5.61%, css: 0.41%)", ...]` at `.jscpd.json` lines 2–7.       |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-002` — Suggestion — `.gitignore` has a redundant `reports/duplication` entry below the parent `reports` entry. Intentional per FR-004, but harmless to remove in a future cleanup.

## Unresolved Assumptions or Follow-Up

- **F-001 root cause**: The `pnpm add -D jscpd` command failed with EACCES due to a pre-existing mixed-package-manager environment (both `package-lock.json` and `pnpm-lock.yaml` present). The fix is to run `pnpm install` after adding jscpd to `package.json`, or to resolve the underlying EACCES issue (likely a permission or ownership problem in `node_modules`). The unresolved mixed-package-manager state is pre-existing and out of scope for this task, but this task cannot be marked done until the pnpm lockfile is consistent.
- **CI exit behavior**: The Context section states the script should "exit 0 even when duplication is found", but `threshold: 1` causes exit 1 at the current 5.01% baseline. AC-001 accepts either exit code, so this is not a blocking finding. Task 020 (unified quality gate) should decide whether to raise the threshold or treat the check as non-blocking (e.g., by appending `|| true` to the script or raising `threshold` to accommodate the documented baseline).
