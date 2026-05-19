# ADR 005: Runtime Deployment Mode Selection

## Status

Accepted

## Date

2026-05-18

## Related Tasks

- `tasks/issues/007-add-composition-containers.md`

## Context

The composition root pattern requires the app startup to select one container — `client-only`, `client-server`, or `serverless`. The mechanism that communicates the chosen mode to the startup code must:

- Work without a code change when the deployment mode changes.
- Be readable at the app entry point (`src/app/main.ts`).
- Not require a server round-trip before the first render.

## Decision

Use a Vite build-time environment variable (`VITE_RUNTIME_MODE`) to select the container. The `src/composition/app-container.ts` reads `import.meta.env.VITE_RUNTIME_MODE` and returns the appropriate container factory. Defaults to `client-only` when the variable is absent.

## Options Considered

1. Vite build-time env var (`VITE_RUNTIME_MODE`). `(recommended)`
2. Runtime config object fetched from `/app-config.json` before startup — flexible but adds a blocking network request and error-handling complexity before the first render.
3. Automatic detection (URL pattern, `navigator.onLine`, feature-flag endpoint) — fragile, requires heuristics that can mis-detect mode.

## Consequences

Positive:

- Zero runtime cost — the branch is resolved at build time and tree-shaken by the bundler.
- Deployment-mode change requires only an env var update, not a code change.
- Default fallback (`client-only`) makes local development work with no configuration.

Negative:

- Switching modes requires a rebuild — not suitable for runtime A/B or gradual rollout.
- Build artifacts are mode-specific; a single bundle cannot serve both modes.

## Validation

- Build with `VITE_RUNTIME_MODE=client-server` and verify the app uses HTTP repository adapters.
- Build without `VITE_RUNTIME_MODE` and verify the app falls back to `client-only` with localStorage adapters.
- Confirm the unused container's import is absent from the production bundle.

## Open Questions

- Should `serverless` mode be a separate container or a variant of `client-server` with different base URLs?
- Should unused container code be split into separate entry-point chunks to keep each bundle minimal?
