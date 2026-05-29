# ADR 001: Define Clean Architecture Boundaries

## Status

Proposed

## Date

2026-05-24

## Context

Portable BI started as a client-only prototype and now has a partial clean architecture shape with `src/core`, `src/adapters`, `src/composition`, `src/features`, `src/infra`, and `src/shared`. The current code still has parallel paths where UI and feature registries directly use `localStorage`, global DB services, and feature-specific data modules. The architecture must make the BI domain obvious and keep deployment mode, frameworks, storage, databases, and libraries as details.

## Decision

Adopt a Clean Architecture boundary policy for Portable BI: `core` owns entities, use cases, and ports; `features/*/ui` owns presentation; `adapters` and `infra` own technical integrations; `composition` owns wiring; `shared` may contain presentation-neutral utilities but must not become an inner-layer dependency bucket. Dependencies must point toward stable business contracts.

## Options Considered

1. Keep the current mixed feature/registry/use-case structure and improve it opportunistically.
2. Adopt a strict Clean Architecture boundary map and migrate in vertical slices. `(recommended)`
3. Move to package-per-service immediately.

## Consequences

Positive:

- Developers can understand the product from business modules before technical details.
- Client-only and server-backed deployments can share application contracts.
- Tests can target stable use cases and ports instead of volatile UI/storage details.

Negative:

- Short-term duplication may remain while legacy registries migrate.
- Boundary rules will expose existing cross-layer imports that need planned remediation.

## Validation

- ESLint boundary rules reject new inward dependencies on UI, adapter, infra, or framework modules.
- Unit tests for core use cases run without browser APIs, DuckDB-WASM, Lit, Chart.js, Fuse, MiniSearch, or localStorage.
- Integration tests prove at least one real user flow still works through composition after each migration.

## Open Questions

- Should `shared` be split into `core/shared-kernel`, `ui/shared`, and `technical/shared`, or should its current modules be relocated case by case?
- Should features be organized as `features/<capability>/{application,domain,ui}` or should application/domain stay only under `src/core`?
