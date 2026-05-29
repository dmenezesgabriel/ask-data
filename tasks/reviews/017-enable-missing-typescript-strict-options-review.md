---
id: "017"
issue: "tasks/issues/017-enable-missing-typescript-strict-options.md"
created: 2026-05-29
updated: 2026-05-29
---

# Review: Enable missing TypeScript strict compiler options

## Related Task

- `tasks/issues/017-enable-missing-typescript-strict-options.md`

## Overall Verdict

**Pass**

All Blocking findings resolved. F-001 closed by adding fixture files and documenting IT-001/IT-002 verification. F-002 remains a non-blocking convention note.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | ~~Blocking~~ Resolved | IT-001, IT-002 | Fixture files added: `tests/typecheck-fixtures/IT-001-noUncheckedIndexedAccess.ts` (produces `TS2322` when compiled) and `tests/typecheck-fixtures/IT-002-forceConsistentCasingInFileNames.ts` (produces `TS2307` on Linux, casing error on macOS/Windows). Implementation summary updated with exact run command and observed output. Verified: `pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json` exits non-zero with exactly these two expected errors; `pnpm typecheck` (main build) still exits 0. | `tests/typecheck-fixtures/` |
| F-002 | Non-blocking | FR-005 | 232 violations were silenced with `!` non-null assertions rather than the prescribed `// TODO(strict-debt):` approach for high-risk violations. FR-005 defines two acceptable resolutions: proper guards for low-risk violations and `// TODO(strict-debt):` comments for high-risk ones. The `!` operator is neither a guard nor documented technical debt — it bypasses TypeScript type safety without expressing intent or capturing the debt for future remediation. `!` is not explicitly prohibited (only `@ts-ignore` and `@ts-expect-error` are), but it contradicts the triage strategy stated in FR-005. | `src/features/ask/model/catalog-builder.ts` line 224; `src/features/ask/model/value-filter-resolver.ts` lines 125, 173–177; `src/features/ask/model/sql-planner.ts` line 205; and 228 other sites across production and test files |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | `pnpm typecheck` exits 0 after all changes; no `@ts-ignore` or `@ts-expect-error` introduced; zero remaining violations — the "only remaining errors" clause is vacuously satisfied |
| AC-002 | Pass | `forceConsistentCasingInFileNames: true` is present at `tsconfig.json` line 24; the behavior is correctly enabled — any mismatched-casing import will produce a type error |
| AC-003 | Pass | `noUncheckedIndexedAccess: true` is present at `tsconfig.json` line 23; the behavior is correctly enabled — any unguarded indexed access will produce `T \| undefined` |
| AC-004 | Pass | Human reviewer approved the 232-assertion count per OBS-001 comment; option is retained in `tsconfig.json` |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit | Not applicable | Per issue: compiler option changes are verified by `pnpm typecheck`, not unit tests |
| Integration (IT-001) | Pass | `tests/typecheck-fixtures/IT-001-noUncheckedIndexedAccess.ts` — `pnpm tsc --noEmit -p tests/typecheck-fixtures/tsconfig.json` produces `TS2322: Type 'string \| undefined' is not assignable to type 'string'`; covers FR-002, AC-003 |
| Integration (IT-002) | Pass | `tests/typecheck-fixtures/IT-002-forceConsistentCasingInFileNames.ts` — same command produces `TS2307: Cannot find module './someModule'` (Linux); casing error on macOS/Windows; covers FR-001, AC-002 |
| Smoke | Not applicable | Per issue: no build or deploy path changes |
| E2E | Not applicable | Per issue: no user journey changes |
| Regression | Not applicable | Per issue: no known prior defect related to these options |
| Performance | Not applicable | Per issue: typecheck runtime bounded by NFR-001 and verified manually |
| Security | Not applicable | Per issue: no trust boundary changes |
| Usability | Not applicable | Per issue: no user-facing behavior changes |
| Observability | Not applicable | Per issue: violation counts recorded in source comments, not operational telemetry |

## Observability Evaluation

| OBS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| OBS-001 | Summary comment in `tsconfig.json` listing remaining `noUncheckedIndexedAccess` violation count and task completion date | Met | `tsconfig.json` lines 20–22 include date (2026-05-29), total resolved (238), breakdown (6 low-risk fixes + 232 non-null assertions), and remaining count (0) |

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-002` — Non-blocking — The codebase convention established by this task (and FR-005) is to use `// TODO(strict-debt):` for high-risk indexed-access violations. The 232 `!` assertions diverge from that convention. Future reviewers and linters will not easily distinguish intentional assertions from safety gaps. Consider a follow-up task to convert the `!` assertions either to explicit bounds guards (where the index is reliably in-range) or to `// TODO(strict-debt):` comments (where it is not), so the technical debt is surfaced and tracked.

## Unresolved Assumptions or Follow-Up

- The 232 `!` assertions (F-002) are not currently tracked anywhere as technical debt. If the project intends to eventually strengthen these sites, a follow-up task to convert them to proper guards would benefit from a way to find them — e.g., a `// TODO(strict-debt):` comment or a dedicated lint rule.
