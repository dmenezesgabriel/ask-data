# Implementation Summary: Task 009 — HTTP Adapter Write Interface

## Decision

ADR 007 resolved as **Option 2 — ReadOnlyRepository**. No server-side write API exists; the `client-server` mode is currently read-only.

## Files Changed

### New

- `src/core/application/ports/read-only-repository.ts` — `ReadOnlyRepository<T>` interface with `list()` and `get()`
- `src/adapters/http/http-datasource-repository.spec.ts` — UT-001 + REG-001 for datasource adapter
- `src/adapters/http/http-question-repository.spec.ts` — UT-001 + REG-001 for question adapter
- `src/adapters/http/http-dashboard-repository.spec.ts` — UT-001 + REG-001 for dashboard adapter

### Modified

- `src/core/application/ports/index.ts` — exports `ReadOnlyRepository`
- `src/core/application/ports/read-only-repository.ts` — (new, see above)
- `src/core/application/use-cases/datasources/get-datasource.ts` — constructor now accepts `ReadOnlyRepository<Datasource>`
- `src/core/application/use-cases/datasources/list-datasources.ts` — same
- `src/core/application/use-cases/questions/get-question.ts` — constructor now accepts `ReadOnlyRepository<Question>`
- `src/core/application/use-cases/questions/list-questions.ts` — same
- `src/core/application/use-cases/dashboards/get-dashboard.ts` — constructor now accepts `ReadOnlyRepository<Dashboard>`
- `src/core/application/use-cases/dashboards/list-dashboards.ts` — same
- `src/adapters/http/http-datasource-repository.ts` — implements `ReadOnlyRepository<Datasource>`; `save`/`delete` removed
- `src/adapters/http/http-question-repository.ts` — same for `Question`
- `src/adapters/http/http-dashboard-repository.ts` — same for `Dashboard`
- `src/composition/client-server-container.ts` — exposes only read use cases; exports `ClientServerContainer` type
- `docs/adrs/007-http-adapter-write-interface.md` — status updated to Accepted (Option 2)

## Behaviour Implemented

- `HttpDatasourceRepository`, `HttpQuestionRepository`, `HttpDashboardRepository` now implement `ReadOnlyRepository<T>` only. They have no `save` or `delete` methods and no longer throw `NotImplementedError`.
- The six read-only use cases (`GetDatasource`, `ListDatasources`, `GetQuestion`, `ListQuestions`, `GetDashboard`, `ListDashboards`) accept `ReadOnlyRepository<T>` so they continue to work with both HTTP and localStorage adapters (structural subtyping: `DatasourceRepository` satisfies `ReadOnlyRepository<Datasource>`).
- `createClientServerContainer()` returns a container with only read use cases. Its inferred type (`ClientServerContainer`) is narrower than `AppContainer` and makes the absence of write operations visible.
- Passing an HTTP adapter to a write use case (e.g., `new CreateDatasource(httpDatasourceRepo, ...)`) is now a TypeScript compile-time error.

## Tests Added

- **UT-001** (×3): Asserts no `save` or `delete` method exists on each HTTP adapter — 3 tests
- **REG-001** (×3): Mocked `fetch`; verifies `list()` returns the expected entity — 3 tests
- Additional: `get(id)` success and 404 cases for all three adapters — 6 tests
- **Total**: 10 new tests, all passing

## Validations Run

- `npm run typecheck` — clean, no errors
- `npx vitest run src/adapters/http` — 10/10 passed

## Accessibility

Not applicable — no UI touched.

## ADRs Updated

- `docs/adrs/007-http-adapter-write-interface.md` — changed from `Proposed` to `Accepted (Option 2)` with a Decision section.

## Intentional Non-Applicable Test Categories

- Integration tests: HTTP adapters are tested at unit level with mocked fetch; no real server available
- Smoke, E2E, Performance, Security, Usability, Observability: no user-visible behaviour changed; no new trust boundaries

## Unresolved Assumptions / Follow-up Work

- `src/composition/app-container.ts` still casts `createClientServerContainer() as unknown as AppContainer`. This cast hides the structural difference — any UI code calling write use cases (e.g., `container.createDatasource`) in `client-server` mode will get a runtime `undefined` error. This is the scope of **Task 002** (activate composition container).
- `src/adapters/http/http-error.ts` (`NotImplementedError`) is now unreferenced. It can be deleted when Task 002 is resolved and the dead-code sweep is performed.
