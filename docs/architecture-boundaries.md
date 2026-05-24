# Portable BI Architecture Boundaries

This map defines where Portable BI code belongs while the repository migrates toward the Clean Architecture direction defined in ADR 001.

## Dependency Direction

Runtime dependencies point inward toward BI use cases and contracts:

```text
app -> composition -> core
app -> features/ui -> core
composition -> adapters -> core
composition -> infra -> core
features/ui -> shared/ui
infra -> core
```

`core` must not depend on `features`, `adapters`, `infra`, `composition`, `app`, Lit, browser storage, DuckDB-WASM, HTTP, serverless handlers, or deployment mode details.

## Module Responsibilities

| Module | Owns | May depend on |
| --- | --- | --- |
| `src/core` | Portable BI entities, application use cases, and ports for Datasource, Question, Dashboard, Ask Data, Semantic Model, Extension Point, Capability, clocks, IDs, repositories, and query execution. | `core`; temporary `shared` type debt listed below. |
| `src/features` | Feature UI, feature-local presentation models, and legacy feature registries until migrated. UI reads Capability snapshots and calls application contracts; it does not own storage, SQL execution infrastructure, or Deployment Mode selection. | `core`, `shared`, `features` while legacy feature-to-feature UI/model coupling is migrated. |
| `src/adapters` | Concrete implementations of application ports: memory repositories, HTTP repositories, local storage repositories, client crypto, client clocks, and browser query engines. | `core`, `shared`, `infra` where an adapter needs a technical runtime. |
| `src/infra` | Technical runtimes and infrastructure helpers such as database managers and datasource loaders. Infra implements details behind ports and must not define BI policy. | `core`, `shared`. |
| `src/composition` | Deployment Mode wiring, adapter selection, use-case construction, capability assembly, and temporary compatibility registration. Client-only, client-server, serverless, monolith, and microservice composition decisions live here or in outer adapters, not in `core`. | `core`, `adapters`, `infra`, `features`, `shared`. |
| `src/app` | Browser delivery shell, routing, bootstrapping, and top-level Lit custom-element registration. It coordinates the user-facing application and should delegate behavior to composition or feature UI. | `composition`, `features`, `shared`. |
| `src/shared` and `src/components` | Presentation-neutral utilities, shared UI primitives, styles, observability helpers, and compatibility types that are not owned by one feature. Shared must not become a hidden domain or infrastructure layer. | `shared`. |

## Boundary Rules

`npm run lint` runs `eslint src`, and ESLint loads `architecture-boundaries.config.cjs` through `eslint-plugin-boundaries`.

The first enforced fitness rules are intentionally compatible with current code:

- A `core` import from `features`, `adapters`, `infra`, `composition`, or `app` is rejected.
- An `adapters` import from `core` is accepted.
- `composition` may import outer adapters and infra because it owns Deployment Mode assembly.
- `app` may import feature UI and composition, but not `core`, `adapters`, or `infra` directly.
- `src/components` is classified as `shared` until those primitives are either moved under `src/shared/ui` or explicitly kept as a top-level shared UI package.

## Current Migration Debt

These exceptions are explicit debt and should be removed by later migration tasks rather than expanded:

- `src/core/entities/dashboard.ts` and `src/core/entities/ask.ts` depend on broad `src/shared/types/*`. Dashboard persistence compatibility currently requires legacy `DashboardConfig` and Ask Data response types to stay stable while the core contracts are introduced.
- `src/features/ask/model/*` contains Semantic Model, query planning, SQL rendering, and Ask Data behavior that belongs behind core application contracts once ports are in place.
- `src/features/*/data/*-registry.ts` modules still act as seed-data and persistence registries for Datasource, Question, and Dashboard records. Repository adapters and use cases should replace these direct registries.
- Feature UI and orchestration modules still import `src/shared/services/db-service.ts`, which is a global query runtime compatibility bridge. Query execution should move behind injected ports.
- Several feature UI modules import other feature UI/model modules directly, especially Dashboard to Ask/Question/Datasource. These imports are allowed for now to avoid a broad UI rewrite, but future Extension Point and Capability contracts should replace cross-feature internals.
- `src/app/shell/app-shell.ts` imports `features/dashboard/model/dashboard-config.ts` directly to create an empty Dashboard. The shell should eventually request this through application or composition contracts.

## Fitness Test Coverage

`src/shared/architecture/import-boundaries.spec.ts` validates the boundary classifier and exercises ESLint against in-memory fixtures for the two required cases:

- forbidden `core` -> `features`
- allowed `adapters` -> `core`
