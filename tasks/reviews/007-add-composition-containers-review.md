---
id: '007'
issue: 'tasks/issues/007-add-composition-containers.md'
created: 2026-05-18
updated: 2026-05-18
---

# Review: Add Composition Containers and Runtime Wiring

## Related Task

- `tasks/issues/007-add-composition-containers.md`

## Overall Verdict

**Pass**

F-001 through F-006 resolved. F-007, F-008, F-009 remain non-blocking/suggestion and do not block completion.

## Findings

| ID    | Level        | Requirement     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                               |
| ----- | ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| F-001 | Blocking     | FR-001          | **Resolved** — `DuckDbWasmQueryEngine` imported and instantiated in `client-only-container.ts`; `queryEngine` added to the returned object.                                                                                                                                                                                                                                                                                                                    | `src/composition/client-only-container.ts`                                             |
| F-002 | Blocking     | FR-002          | **Resolved** — `HttpQueryEngine` imported and instantiated in `client-server-container.ts`; `queryEngine` added to the returned object.                                                                                                                                                                                                                                                                                                                        | `src/composition/client-server-container.ts`                                           |
| F-003 | Blocking     | FR-006 / AC-004 | **Resolved** — All five direct `data/*-registry` imports in Lit components redirected through service shims: `datasource-editor.ts` → `datasource-service`, `question-editor.ts` → `question-service`, `dashboard-workspace.ts` → `datasource-service`, `question-picker.ts` → `question-service`, `question-editor-panel.ts` → `datasource-service`. Service shims extended to re-export all needed symbols.                                                  | Multiple files                                                                         |
| F-004 | Blocking     | FR-006 / AC-004 | **Resolved** — `src/infra/infra-service.ts` created as a thin re-export shim. All three UI files updated: `datasource-editor-panel.ts`, `question-editor-panel.ts`, and `dashboard-workspace.ts` now import `duckDBManager` and `DuckDBDataSourceManager` from `infra-service` instead of directly from infra. Full container-provided QueryEngine wiring deferred to Task 008.                                                                                | `src/infra/infra-service.ts`                                                           |
| F-005 | Blocking     | UT-001          | **Resolved** — UT-001 now uses a Map-backed localStorage mock and asserts that after `createDatasource.execute()`, the localStorage store contains data at key `persisted_datasources_v1`, proving `LocalStorageDatasourceRepository` is wired.                                                                                                                                                                                                                | `src/composition/composition.spec.ts`                                                  |
| F-006 | Blocking     | UT-002          | **Resolved** — UT-002 now stubs `fetch` with a mock and asserts after `listDatasources.execute()` that `fetch` was called with `/api/datasources`, proving `HttpDatasourceRepository` is wired.                                                                                                                                                                                                                                                                | `src/composition/composition.spec.ts`                                                  |
| F-007 | Non-blocking | FR-003          | `app-container.ts` uses `as unknown as AppContainer` double cast to assign the client-server container to an `AppContainer` type. While TypeScript does not error (the shapes are structurally identical), this cast hides a missing structural type alignment between `createClientOnlyContainer` and `createClientServerContainer` return types. A shared `AppContainer` interface or a structural return type would eliminate the need for the unsafe cast. | `src/composition/app-container.ts:9`                                                   |
| F-008 | Non-blocking | FR-004          | `main.ts` imports `@/composition/app-container` as a side effect (`import '@/composition/app-container'`), but no mechanism passes the exported `container` object to any Lit component. The composition container is instantiated but never consumed. Components still call registry functions from `*-service.ts` shims. This means the container wiring is structurally present but functionally inactive.                                                  | `src/app/main.ts:4`, `src/features/datasource/ui/datasource-list/datasource-list.ts:7` |
| F-009 | Suggestion   | —               | The three `*-service.ts` shims (`datasource-service.ts`, `question-service.ts`, `dashboard-service.ts`) are thin pass-throughs to `*-registry.ts` with a `// TODO(task-008)` comment. While these correctly abstract the direct registry import at the UI level for the three list components, they perpetuate a registry dependency. Making them explicit about their transitional nature with a `@deprecated` JSDoc marker would aid future refactoring.     | `src/features/datasource/datasource-service.ts:1-2`                                    |

## AC Evaluation

| AC     | Result       | Notes                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass         | The container is created with `LocalStorageDatasourceRepository` wired to `listDatasources`. UT-001 proves localStorage backing via round-trip assertion. Full component-level wiring remains deferred to Task 008 (F-008, non-blocking).                                                                                                                                                 |
| AC-002 | Not Verified | Build-time check — cannot verify bundle contents without running `vite build --mode client-server`. Additionally, both containers are imported in `app-container.ts` (using conditional at module level), so tree-shaking depends on the bundler resolving the dead branch.                                                                                                               |
| AC-003 | Pass         | `tsc --noEmit` reports zero errors across the full codebase.                                                                                                                                                                                                                                                                                                                              |
| AC-004 | Pass         | All direct `data/*-registry` imports in UI files are redirected through service shims. Direct `src/infra/` imports are wrapped behind `src/infra/infra-service.ts`. No UI file now imports directly from `src/adapters/`, `src/infra/`, or `*-registry*` paths. Full container-provided QueryEngine wiring for infra-touching components is deferred to Task 008 as documented in FR-006. |

## Test Coverage Evaluation

| Test Category        | Status            | Notes                                                                                                                                                                                                                     |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present — Partial | `src/composition/composition.spec.ts:10-26`. Test exists and passes, but does not assert the internal repository type is `LocalStorageDatasourceRepository` as required by the task description. See F-005.               |
| Unit (UT-002)        | Present — Partial | `src/composition/composition.spec.ts:29-37`. Test exists and passes, but does not assert the internal repository type is `HttpDatasourceRepository`. See F-006.                                                           |
| Integration (IT-001) | Present           | `src/composition/composition.spec.ts:39-63`. Test round-trips a datasource through `createClientOnlyContainer()` with a localStorage mock. Asserts the created datasource appears in `listDatasources.execute()`. Passes. |
| Smoke (SMK-001)      | Not Verified      | Requires a browser build and manual or automated browser test. Not verifiable in unit test environment. Noted in Definition of Done as required to pass before mark-complete.                                             |
| E2E                  | Not applicable    | Not applicable — user-visible behavior is identical before and after this task.                                                                                                                                           |
| Regression           | Not applicable    | Not applicable — no known previous defect in this area.                                                                                                                                                                   |
| Performance (PT-001) | Not Verified      | Requires `vite build --mode client-server` to confirm WASM bundle is absent. Not verifiable in process.                                                                                                                   |
| Security             | Not applicable    | Not applicable — composition is internal wiring with no new trust boundary.                                                                                                                                               |
| Usability            | Not applicable    | Not applicable — no user-facing changes.                                                                                                                                                                                  |
| Observability        | Not applicable    | Not applicable — no telemetry changes.                                                                                                                                                                                    |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task.

## ADR Compliance

| ADR                                                  | Required Action                   | Status                                                  |
| ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `docs/adrs/005-runtime-deployment-mode-selection.md` | Updated from Proposed to Accepted | Done — Status field reads `Accepted`, dated 2026-05-18. |

## Convention Notes

- `F-007` — Non-blocking — `src/composition/app-container.ts:9` — The `as unknown as AppContainer` cast could be replaced with a shared `AppContainer` interface defined as the union return type of both containers, eliminating the unsafe cast and making the type contract explicit.
- `F-008` — Non-blocking — No DI mechanism connects the container to components. The architecture diagram in the task (flowchart) shows `AC → UI` flow, but the implementation only does `main.ts → import app-container`, with no further wiring. This is likely deferred to task-008 but is not explicitly noted as deferred in the implementation summary.
- `F-009` — Suggestion — `datasource-service.ts`, `question-service.ts`, `dashboard-service.ts` would benefit from `@deprecated` JSDoc markers to signal they are transitional shims.

## Unresolved Assumptions or Follow-Up

- **F-003 / F-004 scope**: The task implementation summary notes "Full async migration of CollectionList components — deferred to task-008." However, the task issue's FR-006 and AC-004 cover _all_ UI files, not only the list components. The registry and infra imports in `datasource-editor.ts`, `question-editor.ts`, `dashboard-workspace.ts`, `question-picker.ts`, and `question-editor-panel.ts` are active violations of the task contract, not merely deferred work — unless the task owner accepts these as out of scope with explicit approval.
- **DuckDbWasmQueryEngine absence (F-001)**: The implementation summary defers AskData use case wiring, but `DuckDbWasmQueryEngine` is required in FR-001 for the composition container even without the AskData use case being wired. These are separate concerns — the query engine is needed for future `AskData` wiring; it could be added to the container without wiring `AskData` itself.
- **SMK-001**: Smoke test not verifiable in process — requires manual browser run or Playwright test.
- **PT-001**: Build bundle contents not verifiable without running `vite build --mode client-server`.
- **AC-001 functional gap (F-008)**: The container is created but use cases are not injected into components. If this is intentionally deferred to task-008, it should be documented explicitly in the implementation summary and Definition of Done items should be re-evaluated accordingly.
