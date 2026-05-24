# ADR 003: Keep Deployment Mode as Composition Detail

## Status

Proposed

## Date

2026-05-24

## Context

Portable BI must continue to support full client-only deployment while staying open to client-server, serverless, monolith, and microservice deployments. The current `client-only` and `client-server` containers are a useful start, but some UI paths still reach browser storage, global DB services, and feature registries directly.

## Decision

Keep deployment topology outside the core. Use composition containers and delivery adapters to bind the same application use cases to client-only, HTTP, serverless, monolith, or microservice runtimes. Core use cases and ports must not branch on deployment mode.

## Options Considered

1. Keep separate code paths per deployment mode.
2. Use shared use cases and deployment-specific composition/adapters. `(recommended)`
3. Design directly for microservices and back-port client-only support.

## Consequences

Positive:
- Client-only remains a supported production topology.
- Future serverless or server deployments can reuse core contracts.
- Runtime-specific tests can verify adapter behavior without changing business rules.

Negative:
- Composition must become more explicit and better typed.
- Some browser-only assumptions must be removed from feature UI and registries.

## Validation

- Client-only smoke tests still load and execute dashboard/query flows.
- Client-server container composes read/query ports without exposing write-only browser assumptions.
- A serverless handler can invoke a use case through the same core contract in tests.

## Open Questions

- Which deployment modes need first-class CI coverage now?
- Should HTTP contracts be generated from TypeScript types or maintained manually?
