# ADR 003: DuckDB WASM Asset Delivery Strategy

- **Status**: Proposed
- **Date**: 2026-05-16
- **Deciders**: Gabriel Menezes

## Context

`DuckDBManager` currently calls `duckdb.getJsDelivrBundles()` to resolve WASM bundle URLs from the jsDelivr CDN at runtime. It then constructs a Worker via `URL.createObjectURL` and `importScripts`. This creates a runtime dependency on external CDN availability and prevents offline use.

The project uses Vite as its build tool. Vite supports importing binary assets (including `.wasm` files and worker scripts) as local URLs via the `?url` query suffix, which integrates them into the Vite asset pipeline and serves them from the local dev server or the production bundle.

## Decision

Replace CDN-based delivery with Vite-managed local assets:

- Import MVP and EH WASM modules and their companion workers using the `?url` Vite suffix.
- Define a `MANUAL_BUNDLES` object passed to `duckdb.selectBundle()` instead of calling `getJsDelivrBundles()`.
- Pass the resolved worker URL string directly to `new Worker()`, removing the `URL.createObjectURL` / `importScripts` / `URL.revokeObjectURL` pattern.
- Exclude `@duckdb/duckdb-wasm` from Vite's dependency pre-bundling via `optimizeDeps.exclude` to prevent Vite from processing the WASM binary.

## Consequences

**Positive:**

- WASM assets are served from the same origin as the app — no external CDN dependency at runtime.
- Works offline and in air-gapped environments after the initial load.
- Vite correctly fingerprints and caches WASM assets across deployments.
- Worker URL is resolved at build time, avoiding the blob URL workaround.

**Negative:**

- WASM binaries (~7–10 MB) are included in the project's build output, increasing bundle size compared to CDN delivery where assets are cached globally.
- Requires `optimizeDeps.exclude` to be kept in sync with future `@duckdb/duckdb-wasm` upgrades.

## Alternatives Considered

1. **Keep jsDelivr CDN delivery** — simpler code, global CDN cache, but runtime network dependency and no offline support. Rejected because Vite-native asset handling is the correct long-term approach for this stack.
2. **Use a CDN with a fallback** — adds complexity without eliminating the failure mode. Rejected as over-engineering for the current stage.
