---
id: '003'
created: 2026-05-19
updated: 2026-05-19
status: active
---

# Task: Resolve HTTP adapter write interface — eliminate silent NotImplementedError

## Priority

P1 — The `client-server` mode silently throws `NotImplementedError` on any mutation (create, update, delete) for Datasources, Questions, and Dashboards. There is no compile-time signal. Any deployment in `client-server` mode is broken for writes.

## Dependencies

- No task dependency; this can start in parallel with Task 002.
- Depends on ADR `docs/adrs/007-http-adapter-write-interface.md` — the port-narrowing vs. full-HTTP-implementation strategy must be decided before coding begins.

## Assignability

**HITL** — requires human decision on ADR `docs/adrs/007-http-adapter-write-interface.md` before work starts. Specifically: whether to implement HTTP CRUD write methods (requires knowing the server API shape) or introduce a `ReadOnlyRepository<T>` interface (structural port change, no server required).

## Context

`HttpDatasourceRepository`, `HttpQuestionRepository`, and `HttpDashboardRepository` each implement the full `DatasourceRepository` / `QuestionRepository` / `DashboardRepository` port. All three interfaces include `save(entity)` and `delete(id)`. The HTTP adapters throw at runtime:

```ts
async save(_datasource: Datasource): Promise<void> {
  throw new NotImplementedError(`${this.baseUrl} save`);
}
async delete(id: string): Promise<void> {
  throw new NotImplementedError(`${this.baseUrl}/${id} delete`);
}
```

TypeScript cannot detect this mismatch at compile time because `NotImplementedError` is thrown inside a method that correctly satisfies the interface signature. The composition container uses an `as unknown as AppContainer` cast (addressed separately in Task 002), which further hides structural differences between the client-only and client-server containers.

Two resolution strategies are viable, depending on whether a server-side API exists:

- **If a server API exists**: implement the missing HTTP write methods (POST/PUT/DELETE).
- **If no server API exists yet**: introduce a `ReadOnlyRepository<T>` port interface that exposes only `list()` and `get()`, and have the HTTP adapters implement that narrower interface. The composition container then returns different types per adapter, making the absence of writes visible at compile time.

## Use Cases

- **Feature**: Datasource management in client-server mode
- **Scenario**: Developer wires client-server container and tries to save a Datasource
- **Given** the app is running in `client-server` mode
- **When** a developer writes code that calls `container.createDatasource.execute(...)`
- **Then** either (a) the datasource is sent to the server and persisted, or (b) a TypeScript compile error tells them that `CreateDatasource` requires a writable repository

## Definition of Ready

- ADR `docs/adrs/007-http-adapter-write-interface.md` is accepted.
- If option 1 (full HTTP): the server endpoint shapes for `POST/PUT/DELETE /datasources`, `/questions`, `/dashboards` are documented.
- If option 2 (ReadOnlyRepository): the port interface location and name are agreed upon.

## Functional Requirements

- `FR-001`: No HTTP adapter throws `NotImplementedError` for any interface method it declares to implement.
- `FR-002` (option 1): `HttpDatasourceRepository.save()` sends a `POST /datasources` or `PUT /datasources/:id` request and returns the server's response. `delete()` sends `DELETE /datasources/:id`.
- `FR-002` (option 2): A `ReadOnlyRepository<T>` interface is defined in `src/core/application/ports/` containing only `list(): Promise<T[]>` and `get(id: string): Promise<T | null>`. All three HTTP adapters implement `ReadOnlyRepository<T>` and no longer implement the full `*Repository` interfaces.
- `FR-003`: `VITE_RUNTIME_MODE=client-server` produces a container where the absence or presence of write methods is visible at the TypeScript type level without casts.

## Non-Functional Requirements

- `NFR-001`: TypeScript compiles without errors after the change under both runtime modes.
- `NFR-002`: ESLint `boundaries/dependencies` rules continue to pass.

## Observability Requirements

- `OBS-001`: No new observability requirements; existing HTTP error logging in the adapters is sufficient.

## Acceptance Criteria

- `AC-001`: **Given** `VITE_RUNTIME_MODE=client-server`, **When** `npm run typecheck` is executed, **Then** there are no type errors related to the HTTP adapter write interface.
- `AC-002`: **Given** option 1 is chosen, **When** `HttpDatasourceRepository.save(datasource)` is called, **Then** a `POST` or `PUT` request is sent to the configured `baseUrl` with the datasource payload.
- `AC-002` (alternative): **Given** option 2 is chosen, **When** a Use Case that requires `save()` is given an `HttpDatasourceRepository`, **Then** TypeScript reports a compile-time type error.
- `AC-003`: No runtime `NotImplementedError` is thrown for any currently-exposed interface method.

## Required Tests

### Unit Tests

- `UT-001` (option 1): Mock `fetch`; call `HttpDatasourceRepository.save(datasource)`; assert the request method is `POST` or `PUT` and the body contains the datasource. Covers `FR-002`, `AC-002`.
- `UT-001` (option 2): Assert that `HttpDatasourceRepository` does not have a `save` or `delete` method at the TypeScript type level. Covers `FR-002`, `AC-002`.

### Integration Tests

Not applicable — HTTP adapters are tested at the unit level with mocked fetch; no real server is available in CI.

### Smoke Tests

Not applicable — these changes do not affect application startup.

### End-to-End Tests

Not applicable — no complete user journey changes until a server is available.

### Regression Tests

- `REG-001`: **Scenario**: `list()` and `get()` still work in client-server mode  
  **Given** the HTTP adapters are updated  
  **When** `HttpDatasourceRepository.list()` is called with a mocked fetch returning `[{ id: '1', ... }]`  
  **Then** the result contains the mocked Datasource  
  Covers `FR-001` — ensures the read path was not broken by the write interface change.

### Performance Tests

Not applicable — HTTP round-trip performance is not a concern for this structural change.

### Security Tests

Not applicable — this task does not touch authentication, authorization, or trust boundaries.

### Usability Tests

Not applicable — no user-visible behaviour changes.

### Observability Tests

Not applicable — no new telemetry paths.

## Definition of Done

- `NotImplementedError` is no longer thrown from any interface method that the adapter declares to implement.
- `npm run typecheck` passes without errors in both `client-only` and `client-server` configurations.
- `UT-001` and `REG-001` pass.
- ADR `docs/adrs/007-http-adapter-write-interface.md` is updated from `Proposed` to `Accepted`.
