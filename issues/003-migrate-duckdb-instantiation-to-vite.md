---
id: '003'
created: 2026-05-16
updated: 2026-05-16
status: active
---

# Task: Migrate DuckDB WASM instantiation to Vite-managed local assets

## Priority

P0 — Unblocks correct production builds; the current CDN-based instantiation bypasses the Vite asset pipeline and will fail or behave unexpectedly in environments without access to jsDelivr.

## Dependencies

- No task dependency; can start immediately.
- Depends on ADR `docs/adrs/003-duckdb-wasm-asset-delivery.md` — the choice between CDN and Vite-bundled delivery is documented there.

## Assignability

**HITL** — requires human review of the ADR (`docs/adrs/003-duckdb-wasm-asset-delivery.md`) to confirm acceptance of the bundle-size trade-off before the implementation is merged.

## Context

`src/infra/db/db.ts` instantiates DuckDB WASM using `duckdb.getJsDelivrBundles()`, which downloads WASM and worker files from the jsDelivr CDN at runtime. It then creates a Web Worker using `URL.createObjectURL` wrapping an `importScripts` call, which is a workaround needed when the worker URL comes from a CDN blob.

Vite provides a `?url` import suffix that resolves any asset (including `.wasm` binaries and `.worker.js` scripts) to a local URL served from the Vite dev server or the production bundle. Using `?url` imports lets DuckDB be instantiated with `MANUAL_BUNDLES` pointing to local assets, removes the CDN dependency, and eliminates the blob URL workaround. `vite.config.ts` must also exclude `@duckdb/duckdb-wasm` from Vite's dependency pre-bundling to prevent Vite from trying to transform the WASM binary.

## Use Cases

- **Feature**: DuckDB WASM initialization
- **Scenario**: App loads DuckDB without a CDN connection
- **Given** the user opens the app in a network-constrained or air-gapped environment
- **When** `DuckDBManager.initialize()` is called for the first time
- **Then** DuckDB initializes successfully using WASM assets served from the same origin

- **Feature**: DuckDB WASM initialization
- **Scenario**: Production build includes WASM assets
- **Given** the developer runs `vite build`
- **When** the build completes
- **Then** the WASM modules and worker scripts appear as fingerprinted files in `dist/assets/`

## Definition of Ready

- ADR `docs/adrs/003-duckdb-wasm-asset-delivery.md` exists and the bundle-size trade-off is understood.
- `@duckdb/duckdb-wasm@1.30.0` is installed and exposes `dist/duckdb-mvp.wasm`, `dist/duckdb-eh.wasm`, `dist/duckdb-browser-mvp.worker.js`, and `dist/duckdb-browser-eh.worker.js`.
- Vite `^6.0.0` is available; `?url` import suffix behavior is confirmed.

## Functional Requirements

- `FR-001`: `DuckDBManager.initialize()` must load WASM and worker assets from local Vite-served URLs, not from `jsDelivr.net`.
- `FR-002`: The worker must be constructed by passing the resolved local URL string to `new Worker()`, without `URL.createObjectURL` or `importScripts`.
- `FR-003`: `vite.config.ts` must exclude `@duckdb/duckdb-wasm` from `optimizeDeps` so Vite does not attempt to pre-bundle the WASM binary.
- `FR-004`: The existing `DuckDBManager` public API (`initialize`, `getConnection`, `query`) must remain unchanged.

## Non-Functional Requirements

- `NFR-001`: `vite build` must complete without WASM-related errors or unresolved asset warnings.
- `NFR-002`: The WASM MVP and EH bundles must appear as fingerprinted static assets under `dist/assets/` after build.

## Observability Requirements

- `OBS-001`: Not applicable — this task changes infrastructure wiring only; no new user-visible telemetry is introduced.

## Acceptance Criteria

- `AC-001`: **Given** the production build output, **When** `dist/assets/` is listed, **Then** files matching `duckdb-mvp.wasm`, `duckdb-eh.wasm`, and their companion worker scripts are present.
- `AC-002`: **Given** a running Vite dev server, **When** `DuckDBManager.initialize()` is called, **Then** network requests for DuckDB assets target `localhost`, not `cdn.jsdelivr.net`.
- `AC-003`: **Given** `src/infra/db/db.ts` after the change, **When** the file is read, **Then** `getJsDelivrBundles`, `URL.createObjectURL`, `importScripts`, and `URL.revokeObjectURL` are absent.
- `AC-004`: **Given** `vite.config.ts` after the change, **When** the file is read, **Then** `@duckdb/duckdb-wasm` appears in `optimizeDeps.exclude`.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — `DuckDBManager` depends on browser globals (`Worker`, `URL`) that cannot be meaningfully isolated; its behavior is verified through integration.

### Integration Tests

- `IT-001`: **Scenario**: DuckDB initializes and executes a query end-to-end  
  **Given** `DuckDBManager` is initialized with Vite-bundled assets  
  **When** `query("SELECT 42 AS answer")` is called  
  **Then** the result contains `{ answer: 42 }`  
  Covers `FR-001`, `FR-002`, `AC-002`.

### Smoke Tests

- `SMK-001`: **Scenario**: Production build completes without WASM errors  
  **Given** the project source after this change  
  **When** `vite build` runs  
  **Then** the build exits `0` and `dist/assets/` contains the WASM and worker files  
  Covers `NFR-001`, `NFR-002`, `AC-001`.

### End-to-End Tests

- `E2E-001`: Not applicable — DuckDB initialization is an infrastructure concern, not a complete user journey; the integration test covers the boundary.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect to guard against.

### Performance Tests

- `PT-001`: Not applicable — WASM initialization latency is unchanged by asset delivery origin; no new performance risk.

### Security Tests

- `ST-001`: Not applicable — this task does not touch authentication, authorization, input handling, or data exposure.

### Usability Tests

- `UX-001`: Not applicable — this task changes infrastructure wiring with no user-facing behavior change.

### Observability Tests

- `OT-001`: Not applicable — no new telemetry is introduced.

## Definition of Done

- Code is implemented inside `src/infra/db/db.ts` and `vite.config.ts` only.
- `IT-001` integration test passes against the updated `DuckDBManager`.
- `SMK-001` smoke test (`vite build`) passes with WASM assets present in `dist/assets/`.
- `AC-001`–`AC-004` are verified and all pass.
- ADR `docs/adrs/003-duckdb-wasm-asset-delivery.md` is updated from `Proposed` to `Accepted`.
