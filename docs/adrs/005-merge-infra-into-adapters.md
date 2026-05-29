# ADR 005: Merge infra/ into adapters/

## Status

Proposed

## Date

2026-05-29

## Context

`src/infra/` was introduced to hold low-level technical concerns (DuckDB WASM initialization, connection pooling, data-source view management) separate from the higher-level adapter wrappers in `src/adapters/`. In practice the separation produced no isolation: `infra/db/db.ts` is imported only by `adapters/client/duckdb-wasm/duckdb-query-engine.ts`, and `infra/data-sources/data-source-manager.ts` is its only companion. There is no second consumer, no meaningful reuse across unrelated adapters, and no test that targets `infra/` as a distinct boundary.

The named `infra` zone in the ESLint boundary config adds a rule that cannot be meaningfully violated — any import from `adapters/` to `infra/` is trivially allowed because both are "outside CORE." The zone exists but provides no enforcement value.

ADR 001 established the layers as: `core`, `features`, `adapters`, `composition`, `app`, `shared`. `infra` was not named as a first-class layer in that decision.

## Decision

Dissolve `src/infra/` as a named layer. Move its contents into `src/adapters/duckdb/` alongside the adapter files that own them. Remove the `infra` zone from `architecture-boundaries.config.cjs`.

The resulting `src/adapters/duckdb/` directory is self-contained: DuckDB WASM initialization, connection management, view creation, and query execution live together and are hidden behind `QueryEngine` and `DataSourceManager` ports.

## Options Considered

1. Merge `infra/` into `adapters/duckdb/` — one self-contained DuckDB adapter directory. `(recommended)`
2. Keep `infra/` and restrict it to DuckDB WASM initialization only — enforced by ESLint.
3. Promote `infra/` to a peer of `adapters/` with multiple independent occupants.

## Consequences

Positive:

- All DuckDB WASM concerns live in one directory; onboarding requires reading one folder.
- ESLint boundary config becomes simpler — one fewer named zone and one fewer rule to maintain.
- No artificial traversal: `adapter → infra → WASM` collapses to `adapter → WASM`.

Negative:

- If a second low-level infrastructure concern appears in the future (e.g., IndexedDB, WebWorker pool), it will need its own `adapters/<name>/` directory rather than a shared `infra/` bucket.

## Validation

- `src/infra/` directory is deleted after task 022 is complete.
- `grep -r 'from.*infra/' src/` returns no results.
- All DuckDB adapter unit and integration tests pass.
- ESLint boundary rules pass with the `infra` zone removed.

## Open Questions

- Should the future `adapters/` directory enforce that each subdirectory owns only one port implementation? (Linting rule or convention only.)
