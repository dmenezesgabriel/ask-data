---
id: "008"
issue: "tasks/issues/008-tighten-boundaries-and-remove-legacy-registry-debt.md"
created: 2026-05-25
updated: 2026-05-25
---

# Review: Tighten boundaries and remove legacy registry debt

## Related Task

- `tasks/issues/008-tighten-boundaries-and-remove-legacy-registry-debt.md`

## Overall Verdict

**Fail**

Blocked by F-001. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | Blocking | E2E-001 | The required E2E suite is present but does not pass, so the task's Definition of Done item "Required tests for this task pass" is not satisfied. `npm run test:e2e` fails three `dashboard-workspace` scenarios while pre-warming DuckDB through a browser-side dynamic import. | `tests/e2e/features/dashboard-workspace.feature:13`, `tests/e2e/features/dashboard-workspace.feature:18`, `tests/e2e/features/dashboard-workspace.feature:24`, `tests/e2e/steps/steps.ts:106` |
| F-002 | Non-blocking | UT-001 | The import-boundary fixtures verify feature UI to `infra`, but they do not include a fixture for feature UI to `adapters`. The configuration would reject `features` to `adapters`, but the required fixture coverage for the full `feature UI to infra/adapters` prohibition is incomplete. | `src/shared/architecture/import-boundaries.spec.ts:117` |
| F-003 | Non-blocking | FR-004 | The UI-to-feature-registry source scan catches `from .../data/...registry` imports only. Side-effect imports or dynamic imports from a UI module to a feature data registry would not be detected by this scan, so the import check is narrower than the prohibited dependency class. | `src/shared/architecture/import-boundaries.spec.ts:149` |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | Source search found no UI module importing feature data registry modules directly. The added scan also checks UI files for direct `from .../data/...registry` imports at `src/shared/architecture/import-boundaries.spec.ts:149`. |
| AC-002 | Pass | `architecture-boundaries.config.cjs:2` now allows `core` to depend only on `core`; source search found no `src/core` imports from broad `shared` modules. |
| AC-003 | Pass | Lint fixtures exercise prohibited `core` to feature, `core` to broad `shared/types`, and feature UI to `infra` imports; `npm run lint` passed with the tightened rules. |
| AC-004 | Pass | Seed Datasource, Question, and Dashboard availability is covered through catalog repository/use-case tests in `src/composition/use-cases-integration.spec.ts:97`, `src/composition/use-cases-integration.spec.ts:197`, and `src/composition/use-cases-integration.spec.ts:368`. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present with gaps | `src/shared/architecture/import-boundaries.spec.ts` verifies prohibited and allowed boundaries. See F-002 and F-003 for incomplete adapter fixture and registry import-form coverage. |
| Integration (IT-001) | Present | `src/composition/use-cases-integration.spec.ts` covers seeded and user Datasource, Question, and Dashboard repository/use-case behavior. `npm run test:unit -- src/shared/architecture/import-boundaries.spec.ts src/composition/use-cases-integration.spec.ts` passed. `npm run test:integration` also passed. |
| Smoke (SMK-001) | Present | `npm run lint` and `npm run typecheck` both passed. |
| End-to-End (E2E-001) | Present but failing | `tests/e2e/features/dashboard-workspace.feature`, `tests/e2e/features/questions.feature`, and `tests/e2e/features/datasource-collection.feature` cover the main BI navigation/content paths, but `npm run test:e2e` failed three dashboard workspace scenarios. See F-001. |
| Regression (REG-001) | Present | `src/shared/architecture/import-boundaries.spec.ts:134` scans source files outside composition/adapters for `@/shared/services/db-service`; source search found no matches. |
| Performance (PT-001) | Not applicable | The task marks performance tests not applicable because static checks and cleanup do not affect runtime query/dashboard performance. |
| Security (ST-001) | Not applicable | The task marks security tests not applicable because no new input, auth, storage, or external communication behavior is introduced. |
| Usability (UX-001) | Not applicable | The task marks usability tests not applicable because no intentional UI behavior changes are introduced. |
| Observability (OT-001) | Not applicable | The task marks observability tests not applicable because runtime telemetry is unchanged. |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task.

## ADR Compliance

| ADR | Required Action | Status |
|-----|-----------------|--------|
| `docs/adrs/001-define-clean-architecture-boundaries.md` | Updated from `Proposed` to `Accepted` or left with explicit open questions per Definition of Done. | Done — ADR remains `Proposed` and includes explicit open questions at `docs/adrs/001-define-clean-architecture-boundaries.md:42`. |

## Convention Notes

- `F-002` — Non-blocking — Boundary fixture coverage follows the existing `ESLint.lintText` convention, but it omits the feature UI to `adapters` half of the prohibited dependency pair.
- `F-003` — Non-blocking — The registry import scan is simple and fast, which matches NFR-001, but it is narrower than the import forms TypeScript modules can use.

## Unresolved Assumptions or Follow-Up

- Reviewed the working tree diff because the repository is on `master` and `git diff main...HEAD` is not available in this checkout.
- The E2E failure is in the browser test harness dynamic import of `/src/infra/db/db.ts`; this review does not assume whether it is pre-existing or introduced by the task because E2E-001 is required by the task contract.
