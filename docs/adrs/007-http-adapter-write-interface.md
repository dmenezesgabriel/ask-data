# ADR 002: HTTP Adapter Write Interface Strategy

## Status

Accepted — Option 2 (ReadOnlyRepository)

## Date

2026-05-19

## Related Tasks

- `tasks/issues/009-http-adapter-write-interface.md` (Task 009)

## Context

- The project supports a `client-server` deployment mode via `VITE_RUNTIME_MODE=client-server`, which substitutes `HttpDatasourceRepository`, `HttpQuestionRepository`, and `HttpDashboardRepository` for the localStorage adapters.
- These HTTP adapters implement the full `DatasourceRepository` / `QuestionRepository` / `DashboardRepository` ports, which include `save()` and `delete()`.
- Currently all three HTTP adapters throw `NotImplementedError` from `save()` and `delete()`. There is no compile-time indication of this limitation.
- In `client-server` mode, any user action that creates, edits, or deletes a Datasource, Question, or Dashboard throws a runtime error with no graceful degradation.

## Decision

Option 2 — `ReadOnlyRepository<T>`. No server-side write API exists. The HTTP adapters now implement the narrower `ReadOnlyRepository<T>` interface (only `list()` and `get()`). The `client-server` composition container exposes only read use cases. Write use cases (`CreateDatasource`, `UpdateDatasource`, etc.) are absent from the `client-server` container; any use case that requires `save()` or `delete()` will receive a compile-time type error if handed an HTTP adapter.

## Options Considered

1. **Implement full CRUD HTTP methods in all three adapters** — add `POST`/`PUT`/`DELETE` calls to the adapters, matching the server endpoints that `client-server` mode is meant to target. Assumes a server with these endpoints exists or will be built. `(recommended for production path)`

2. **Introduce a `ReadOnlyRepository<T>` interface** — define a narrower port that omits `save` and `delete`; have the HTTP adapters implement only `ReadOnlyRepository<T>`. The composition container returns different types for read-only vs read-write adapters. This is the honest representation of the current state and does not require a server to exist. `(recommended if no server exists yet)`

3. **Keep `NotImplementedError` and document the limitation** — add a comment in the container and in the README that `client-server` mode is read-only. No code change. Leaves the silent runtime failure in place.

## Consequences

Positive (option 2):

- Eliminates the silent runtime failure without requiring a server to be built first.
- Callers that need `save`/`delete` get a compile-time type error if they receive a `ReadOnlyRepository`.
- The port boundary becomes honest about what each adapter can do.

Negative (option 2):

- Adds a new interface to the ports layer.
- Existing use cases that accept `DatasourceRepository` cannot be called with a `ReadOnlyRepository` without overloading or conditional wiring.
- Does not unblock the `client-server` write path — that still requires option 1 eventually.

## Validation

- TypeScript compiles without error when the HTTP adapters implement the narrower interface.
- A runtime test verifies that `list()` and `get()` work in `client-server` mode.
- No runtime `NotImplementedError` is thrown when the app is used in `client-server` mode for read operations.

## Open Questions

- Does a server-side API for this app exist, or is the `client-server` mode purely aspirational at this time?
- If a server exists, what are the endpoint shapes for `POST /datasources`, `PUT /datasources/:id`, and `DELETE /datasources/:id`?
