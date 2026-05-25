# Portable BI Architecture Boundaries

This map defines where Portable BI code belongs while the repository follows the Clean Architecture direction defined in ADR 001.

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

| Module                            | Owns                                                                                                                                                                                                                                                                     | May depend on                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core`                        | Portable BI entities, application use cases, and ports for Datasource, Question, Dashboard, Ask Data, Semantic Model, Extension Point, Capability, clocks, IDs, repositories, and query execution.                                                                       | `core`.                                                                                                                                                                          |
| `src/features`                    | Feature UI, feature-local presentation models, and legacy feature registries until migrated. UI reads Capability snapshots and calls application contracts; it does not own storage, SQL execution infrastructure, or Deployment Mode selection.                         | `core`, `shared`, `features` while legacy feature-to-feature UI/model coupling is migrated. Feature UI must not import feature data registries, `infra`, or `adapters` directly. |
| `src/adapters`                    | Concrete implementations of application ports: memory repositories, HTTP repositories, local storage repositories, client crypto, client clocks, and browser query engines.                                                                                              | `core`, `shared`, `infra` where an adapter needs a technical runtime.                                                                                                            |
| `src/infra`                       | Technical runtimes and infrastructure helpers such as database managers and datasource loaders. Infra implements details behind ports and must not define BI policy.                                                                                                     | `core`, `shared`.                                                                                                                                                                |
| `src/composition`                 | Deployment Mode wiring, adapter selection, use-case construction, capability assembly, and temporary compatibility registration. Client-only, client-server, serverless, monolith, and microservice composition decisions live here or in outer adapters, not in `core`. | `core`, `adapters`, `infra`, `features`, `shared`.                                                                                                                               |
| `src/app`                         | Browser delivery shell, routing, bootstrapping, and top-level Lit custom-element registration. It coordinates the user-facing application and should delegate behavior to composition or feature UI.                                                                     | `composition`, `features`, `shared`.                                                                                                                                             |
| `src/shared` and `src/components` | Presentation-neutral utilities, shared UI primitives, styles, observability helpers, and compatibility types that are not owned by one feature. Shared must not become a hidden domain or infrastructure layer.                                                          | `shared`.                                                                                                                                                                        |

## Boundary Rules

`npm run lint` runs `eslint src`, and ESLint loads `architecture-boundaries.config.cjs` through `eslint-plugin-boundaries`.

The enforced fitness rules are intentionally small and strict:

- A `core` import from `features`, `adapters`, `infra`, `composition`, or `app` is rejected.
- A `core` import from broad `shared` modules is rejected; domain and application contracts own their types directly.
- An `adapters` import from `core` is accepted.
- `composition` may import outer adapters and infra because it owns Deployment Mode assembly.
- `app` may import feature UI and composition, but not `core`, `adapters`, or `infra` directly.
- Feature UI imports from `infra`, `adapters`, or feature data registries are rejected by lint fixtures and import scans.
- `src/components` is classified as `shared` until those primitives are either moved under `src/shared/ui` or explicitly kept as a top-level shared UI package.

## Intentional Exceptions

These exceptions are explicit debt and must not be expanded:

| Exception                                                                                                                                                                                                                                                  | Owner                                                       | Reason                                                                                                                                       | Removal condition                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/*/data/*-registry.ts` remains for legacy seed and local-storage compatibility tests.                                                                                                                                                         | Catalog feature maintainers                                 | Seed YAML assets and legacy persisted dashboard records must remain available while repository-backed use cases replace direct registry use. | Remove when datasource, question, and dashboard UI/model paths use only catalog use cases and seeded repository adapters.      |
| Non-UI model/orchestration imports of legacy registries remain in `src/features/ask/orchestration/create-dashboard-orchestrator.ts`, `src/features/dashboard/model/get-dashboard-by-slug.ts`, and `src/features/datasource/model/datasource-migration.ts`. | Feature maintainers for Ask Data, Dashboard, and Datasource | These paths preserve client-only seed lookup and migration behavior outside UI modules.                                                      | Replace with injected repository/use-case access once the remaining orchestration and migration callers are composition-wired. |
| Feature-to-feature imports remain within `src/features` where presentation models still share legacy Dashboard, Question, Datasource, and Ask Data structures.                                                                                             | Feature UI maintainers                                      | Avoids a broad UI rewrite while extension-point contracts mature.                                                                            | Replace with stable Extension Point, Capability, or core application contracts as those flows are touched.                     |
| `src/shared/types/ask.ts` and `src/shared/types/dashboard.ts` remain as compatibility exports for migrated consumers outside `core`.                                                                                                                       | Shared platform maintainers                                 | Existing feature and app callers still use legacy dashboard and Ask Data shapes.                                                             | Delete after consumers import stable `@/core/entities` contracts or feature-local presentation types directly.                 |
| `src/app/shell/app-shell.ts` imports `features/dashboard/model/dashboard-config.ts` to create an empty Dashboard.                                                                                                                                          | App shell maintainers                                       | The shell still needs a legacy empty-dashboard presentation shape.                                                                           | Replace with a composition-level factory or Dashboard use case when the app shell creation flow is migrated.                   |

## Fitness Test Coverage

`src/shared/architecture/import-boundaries.spec.ts` validates the boundary classifier, scans source imports, and exercises ESLint against in-memory fixtures for required cases:

- forbidden `core` -> `features`
- forbidden `core` -> broad `shared/types`
- forbidden feature UI -> `infra`
- allowed `adapters` -> `core`
- no source files outside composition/adapters import `shared/services/db-service`
- no UI modules import feature data registries directly
