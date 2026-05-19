# Task 007 Implementation Summary: Add Composition Containers

## Status

Completed

## Date

2026-05-18

## Changes Made

### ADR 005 — Accepted

- `docs/adrs/005-runtime-deployment-mode-selection.md`: Status changed from `Proposed` to `Accepted`.

### HTTP Adapter Stubs (FR-007)

- `src/adapters/http/http-error.ts`: `NotImplementedError` for unimplemented endpoints.
- `src/adapters/http/http-datasource-repository.ts`: `HttpDatasourceRepository` — `list` and `get` make real `fetch` calls; `save` and `delete` throw `NotImplementedError`.
- `src/adapters/http/http-question-repository.ts`: Same pattern for questions.
- `src/adapters/http/http-dashboard-repository.ts`: Same pattern for dashboards.
- `src/adapters/http/http-query-engine.ts`: `HttpQueryEngine` — executes SQL queries via `POST /api/query`.
- `src/adapters/http/index.ts`: Barrel re-export for all HTTP adapters.

### Composition Containers

- `src/composition/client-only-container.ts`: Wires `LocalStorage*Repository` + `CryptoIdGenerator` + `SystemClock` into all CRUD use cases. Exports `AppContainer` type.
- `src/composition/client-server-container.ts`: Same structure with `Http*Repository` adapters.
- `src/composition/app-container.ts`: Reads `import.meta.env.VITE_RUNTIME_MODE`; defaults to `client-only`.

### App Entry Point

- `src/app/main.ts`: Added side-effect import of `@/composition/app-container` to ensure the container is created before any components render.

### FR-006 — Service Shims

Components no longer import directly from `*-registry.ts` files:

- `src/features/datasource/datasource-service.ts`: Thin re-export shim.
- `src/features/question/question-service.ts`: Thin re-export shim.
- `src/features/dashboard/dashboard-service.ts`: Thin re-export shim (includes `DashboardEntry` type).
- `src/features/datasource/ui/datasource-list/datasource-list.ts`: Import updated to `../../datasource-service`.
- `src/features/question/ui/question-list/question-list.ts`: Import updated to `../../question-service`.
- `src/features/dashboard/ui/dashboard-list/dashboard-list.ts`: Import updated to `../../dashboard-service`.

### Tests

- `src/composition/composition.spec.ts`: 3 tests covering UT-001 (client-only container), UT-002 (client-server container), and IT-001 (datasource round-trip via client-only container).

## Deferred

- `AskData` use case is not wired into the container — follow-up task.
- Full async migration of `CollectionList` components — deferred to task-008 per instructions.
- Actual HTTP endpoint implementations (server-side) — out of scope for this task.
