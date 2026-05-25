# Deployment Composition Contracts

Portable BI keeps deployment topology outside core use cases. Each deployment mode creates an `ApplicationComposition` that exposes the same catalog, query, Ask Data, capability, and observability boundaries while swapping adapters at composition time.

## Runtime Modes

- `client-only`: uses browser/local catalog adapters and DuckDB-backed query execution.
- `client-server`: uses HTTP catalog read adapters and HTTP query execution; catalog writes are not advertised unless HTTP write adapters are composed.
- `serverless`: uses the same `ApplicationComposition` contract with memory adapters in the serverless handler harness.

Unknown `VITE_RUNTIME_MODE` values default to `client-only` and emit a startup warning. Core use cases do not inspect runtime mode or deployment-specific environment variables.

## Monolith Mapping

A monolith deployment should compose the same `ApplicationComposition` on the server process boundary. HTTP routes, server-rendered pages, or background jobs call the catalog, query, and Ask Data use cases through the composition object rather than importing repositories or database services directly.

## Microservice Mapping

A microservice deployment should keep the same application contract at service boundaries. API gateway or UI-facing services can use HTTP adapters for remote Datasource, Question, Dashboard, Query, and Ask Data capabilities while individual services compose concrete storage and execution adapters internally.

## Observability

Composition startup logs only the selected deployment mode, enabled platform capability IDs, and supported operation capability IDs. Serverless handler failures log the operation name and correlation ID when one is provided.
