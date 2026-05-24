---
id: "002"
issue: "tasks/issues/002-define-bi-platform-contracts.md"
created: 2026-05-24
updated: 2026-05-24
---

# Implementation Summary: Define BI platform contracts and capabilities

## Related Task

- `tasks/issues/002-define-bi-platform-contracts.md`

## Files Changed

- `src/core/platform/contracts.ts` — added BI platform extension point contracts and capability metadata.
- `src/core/platform/capability-registry.ts` — added in-memory capability registration, lookup, duplicate handling, and available-capability snapshots.
- `src/core/platform/observability-events.ts` — defined registration success and failure event names.
- `src/core/platform/index.ts` — exported the platform API surface.
- `src/core/platform/capability-registry.spec.ts` — covered registry behavior, boundary purity, disabled capabilities, observability event names, and secret-field serialization.
- `src/composition/platform-capabilities.ts` — registered the initial built-in datasource connector through the platform registry.
- `src/composition/platform-capabilities.spec.ts` — verified the built-in contribution is exposed through the platform contract.
- `src/composition/client-only-container.ts` — exposed the platform registry from client-only composition.
- `src/composition/client-server-container.ts` — exposed the platform registry from client-server composition.
- `docs/adrs/002-establish-bi-extension-platform.md` — documented the implemented first platform contract scope and remaining approval question.

## Behavior Implemented

- Defined role-specific contracts for datasource connectors, query executors, semantic model providers, widget renderers, exporters, and storage providers.
- Added `Capability` metadata with stable ID, display name, contribution type, enabled state, and optional feature flag key.
- Added deterministic duplicate capability ID errors.
- Added available-capability listing that excludes disabled contributions while preserving full capability listing for callers that need enabled state.
- Added UI-safe capability snapshots that omit extra runtime fields such as credentials, API keys, and SQL bodies.
- Added platform observability event names without runtime emission.

## Design Notes

- Platform contracts live under `src/core/platform` and import only core domain types.
- The registry keeps extension point contracts narrow instead of introducing a generic plugin interface.
- Built-in contribution registration is composed in `src/composition` so core remains independent of concrete adapters and UI modules.
- Existing user-facing flows were left unchanged; containers now expose the registry for future consumers.

## Tests Added or Updated

- `src/core/platform/capability-registry.spec.ts` — verifies `UT-001`, `UT-002`, `UT-003`, `AC-003`, `OBS-001`, and `ST-001`.
- `src/composition/platform-capabilities.spec.ts` — verifies `IT-001` for built-in datasource connector registration.

## Test Categories Not Applicable

- `Component`: Not applicable — this task changed platform contracts and composition, not UI components.
- `E2E`: Not applicable — this task does not change a complete user journey.
- `Regression`: Not applicable — no known previous defect was targeted.
- `Performance`: Not applicable — registry operations are in-memory and not performance-sensitive at current scale.
- `Usability`: Not applicable — this task does not change user-facing UI.
- `Accessibility`: Not applicable — this task does not change markup, keyboard behavior, focus behavior, or error states.
- `Observability emission`: Not applicable — this task defines event names only; emission is handled by a later observability boundary task.

## Validation Run

```text
npm run test:unit -- --run src/core/platform/capability-registry.spec.ts src/composition/platform-capabilities.spec.ts src/composition/composition.spec.ts — passed
npm run lint — passed
npm run typecheck — passed
npm run test:unit — passed, 52 files and 717 tests
npm run build — passed
```

## Accessibility Notes

- Not applicable — no frontend UI, markup, keyboard behavior, focus behavior, or error states changed.

## Observability Changes

- Added `platform.capability.registration.succeeded` and `platform.capability.registration.failed` event name constants.
- Runtime emission was not added because it belongs to the later observability boundary task.

## ADR Updates

- `docs/adrs/002-establish-bi-extension-platform.md` — documented first platform contract scope and left human approval as the explicit open question.

## Unresolved Assumptions or Follow-Up

- Human approval is still required before ADR 002 can move from `Proposed` to `Accepted`.
- Future tasks still need to wire UI feature availability to capability metadata and add runtime observability emission.
