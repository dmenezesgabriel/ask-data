---
id: "004"
issue: "tasks/issues/004-inject-query-and-ask-ports.md"
created: 2026-05-24
updated: 2026-05-24
---

# Review: Inject Query and Ask Data Ports

## Related Task

- `tasks/issues/004-inject-query-and-ask-ports.md`

## Overall Verdict

**Fail**

Blocked by `F-001`, `F-002`, `F-003`, `F-004`, and `F-005`. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID | Level | Requirement | Description | Evidence |
|----|-------|-------------|-------------|----------|
| F-001 | Blocking | SMK-001 | The required smoke test for Ask Data starting in client-only mode is absent. The implementation summary explicitly says E2E was not run, and no test was found that starts the app without a server and verifies the Ask Data UI initializes without a missing DB service error. | `tasks/issues/004-inject-query-and-ask-ports.md:103`, `tasks/implementation/004-inject-query-and-ask-ports-summary.md:52` |
| F-002 | Blocking | E2E-001 | The required end-to-end user journey for asking a natural-language sales Question and seeing the Ask Data result UI is absent. Existing E2E feature files cover Datasource, Question CRUD, and Dashboard workspace behavior, but no E2E feature contains an Ask Data or natural-language query scenario. | `tasks/issues/004-inject-query-and-ask-ports.md:111`, `tests/e2e/features/questions.feature:1`, `tests/e2e/features/dashboard-workspace.feature:1` |
| F-003 | Blocking | ST-001 | The required security test for failed query log redaction is absent. Existing `ST-001` matches found in the repository are for prior catalog persistence or capability metadata tasks, not failed query logs from Datasource preview, Question preview, Dashboard widget execution, or DuckDB query execution. | `tasks/issues/004-inject-query-and-ask-ports.md:131`, `src/composition/use-cases-integration.spec.ts:303`, `src/core/platform/capability-registry.spec.ts:102` |
| F-004 | Blocking | UX-001 | The required usability test for recoverable query failure states in Datasource, Question, and Dashboard contexts is absent. The changed component specs verify successful previews and widget execution, but they do not assert user-visible failure feedback after injected query or Ask Data port failures. | `tasks/issues/004-inject-query-and-ask-ports.md:135`, `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts:42`, `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:81`, `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts:117` |
| F-005 | Blocking | OT-001 | The required observability test for Ask Data success/failure telemetry with elapsed time and without user question text is absent. Existing Ask Data model tests do not exercise `AskDataEngine.ask()` telemetry, and the only matching `OT-001` found is for catalog mutation logging from a prior task. | `tasks/issues/004-inject-query-and-ask-ports.md:139`, `src/features/ask/model/ask-data.spec.ts:30`, `src/composition/use-cases-integration.spec.ts:274` |
| F-006 | Non-blocking | IT-001 | The client-only integration test is present but incomplete for the scenario text. It verifies that client-only composition exposes a `duckdb-wasm` query adapter and ports, but it does not run a Dashboard widget query through that composition as required by `IT-001`. | `tasks/issues/004-inject-query-and-ask-ports.md:90`, `src/composition/composition.spec.ts:154` |
| F-007 | Non-blocking | OBS-001 | Query failure logging is only partially implemented. UI-level failure catches include operation type and adapter name, but `DuckDBManager.query()` still emits `query.failed` without operation type or deployment adapter name, so some query failure logs do not meet the full `OBS-001` field contract. | `tasks/issues/004-inject-query-and-ask-ports.md:70`, `src/infra/db/db.ts:93` |

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | `DatasourceEditorPanel` accepts an injected `queryPort`, and `UT-001` mounts the component with a fake port without calling `setDbService`. Evidence: `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.ts:41`, `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts:42`. |
| AC-002 | Pass | Client-only composition exposes `queryPort` backed by `duckDBManager`, and AppShell passes that port into Dashboard editors/workspace. Evidence: `src/composition/client-only-container.ts:43`, `src/app/shell/app-shell.ts:207`. |
| AC-003 | Pass | Client-server composition exposes the same `queryPort` shape backed by `HttpQueryEngine`, and `IT-002` verifies query delegation to `/api/query`. Evidence: `src/composition/client-server-container.ts:21`, `src/composition/composition.spec.ts:179`. |
| AC-004 | Pass | Source import inspection found no `shared/services/db-service` imports outside composition/adapters, and the boundary spec enforces that. Evidence: `src/shared/architecture/import-boundaries.spec.ts:82`. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present | `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts:42` verifies Datasource preview works with a fake query port. |
| Unit (UT-002) | Present | `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:81` and `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:100` verify SQL and natural-language Question preview through fake ports. |
| Unit (UT-003) | Present | `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts:117` verifies Dashboard widget SQL delegates through injected query and Datasource ports. |
| Integration (IT-001) | Present | Present but incomplete: `src/composition/composition.spec.ts:154` verifies client-only ports and adapter name, but does not execute a Dashboard widget query through DuckDB-WASM composition. See `F-006`. |
| Integration (IT-002) | Present | `src/composition/composition.spec.ts:179` verifies client-server query execution delegates through the HTTP query adapter. |
| Smoke (SMK-001) | Missing | No smoke test or documented run verifies the Ask Data UI starts in client-only mode without a missing DB service error. See `F-001`. |
| End-to-End (E2E-001) | Missing | No E2E feature covers asking a BI Question and displaying the Ask Data result UI. See `F-002`. |
| Regression (REG-001) | Present | Component tests create Datasource, Question, and Dashboard components with fake ports instead of global DB initialization. Evidence: `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts:42`, `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:81`, `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts:117`. |
| Performance (PT-001) | Not applicable | The issue marks performance tests not applicable because the task changes dependency wiring, not query algorithms. |
| Security (ST-001) | Missing | No task-specific test verifies failed query logs redact raw SQL and Datasource URLs by default. See `F-003`. |
| Usability (UX-001) | Missing | No test verifies recoverable UI feedback for query failure states across Datasource, Question, and Dashboard contexts. See `F-004`. |
| Observability (OT-001) | Missing | No test verifies Ask Data telemetry records elapsed time and omits user question text by default. See `F-005`. |

Targeted verification run during review:

```text
npm run typecheck — passed
npm run test:unit -- --run src/composition/composition.spec.ts src/shared/architecture/import-boundaries.spec.ts — passed, 2 files / 12 tests
npm run test:components -- --run src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts — passed, 3 files / 36 tests
```

## Observability Evaluation

| OBS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| OBS-001 | Query execution failures must be logged with operation type and deployment adapter name, excluding raw SQL unless explicitly enabled for development. | Partial | Datasource, Question, and Dashboard UI catches log operation and adapter without raw SQL. `DuckDBManager.query()` logs `query.failed` without operation type or adapter name. See `F-007`. |
| OBS-002 | Ask Data execution must record success/failure and elapsed time through the observability boundary where available. | Met | `AskDataEngine.ask()` uses a logger span and ends/fails the span with metrics including `totalAskMs`; raw user question text was removed from span metadata. Evidence: `src/features/ask/model/ask-data.ts:373`, `src/features/ask/model/ask-data.ts:491`, `src/features/ask/model/ask-data.ts:499`. |

## ADR Compliance

| ADR | Required Action | Status |
|-----|-----------------|--------|
| `docs/adrs/001-define-clean-architecture-boundaries.md` | Updated from `Proposed` to `Accepted` or left with explicit open questions. | Done — still `Proposed`, with explicit open questions present. |
| `docs/adrs/003-keep-deployment-mode-as-composition-detail.md` | Updated from `Proposed` to `Accepted` or left with explicit open questions. | Done — still `Proposed`, with explicit open questions present. |

## Convention Notes

- `F-006` — Non-blocking — the integration test naming follows the task ID, but its assertions are closer to composition shape verification than the required Dashboard widget query execution scenario.

## Unresolved Assumptions or Follow-Up

- The review evaluated the uncommitted working-tree diff because the task implementation is not committed on the current branch.
- No source files were modified during review; only this review report was created.
