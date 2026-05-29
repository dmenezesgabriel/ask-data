---
id: '023'
created: 2026-05-29
updated: 2026-05-29
status: active
---

# Task: Relocate runtime singletons from CORE and SHARED into composition

## Priority

P1 — Depends on no other refactoring task. Fixes the two remaining inward-dependency violations (mutable state inside CORE; mutable global in SHARED) that prevent the boundary rule "CORE contains no mutable runtime state" from being enforced.

## Dependencies

- No task dependency; can run in parallel with tasks 021 and 022.
- Depends on ADR `docs/adrs/002-establish-bi-extension-platform.md` (Proposed) — `CapabilityRegistry` is part of the extension platform; moving it out of CORE implements ADR 002's decision that the platform API belongs at the application boundary.
- Depends on ADR `docs/adrs/001-define-clean-architecture-boundaries.md` (Proposed) — answers the open question "should shared modules be relocated case by case?" with yes, relocate.

## Assignability

**AFK** — all requirements are resolved; both ADR dependencies exist as stubs with clear direction.

## Context

Two global singletons live in layers that should be stateless:

1. **`core/platform/capability-registry.ts`** — `CapabilityRegistry` has `register()`, `getCapability()`, `getContributions()`, and `requireCapability()`. CORE should contain only entities, ports, and use cases — all stateless. A mutable runtime registry belongs in `composition/`, which already manages the capability lifecycle (`platform-capabilities.ts`, container factories).

2. **`shared/services/catalog-service.ts`** — A module-level mutable reference set by the app container at startup. `shared/` must be stateless utilities; runtime state set by composition belongs in `composition/`.

The extension-point _contracts_ (`core/platform/contracts.ts`) and event names (`core/platform/observability-events.ts`) are type-only and stay in `core/platform/`.

## Use Cases

- **Feature**: Extension capability registration
- **Scenario**: Composition registers a datasource connector capability
- **Given** the client-only container is initializing
- **When** `createPlatformRegistry()` registers the CSV datasource connector
- **Then** the `CapabilityRegistry` in `composition/` records the connector and `core/` remains stateless

## Definition of Ready

- All import sites of `capability-registry.ts` are known (composition files, use cases that call `getContributions`, UI that reads `capabilitySnapshot`).
- All import sites of `catalog-service.ts` are known.
- ADR 002 stub exists at `docs/adrs/002-establish-bi-extension-platform.md`.

## Functional Requirements

- `FR-001`: `CapabilityRegistry` class moves to `composition/capability-registry.ts`.
- `FR-002`: `core/platform/` retains only `contracts.ts`, `observability-events.ts`, and `index.ts` (type re-exports only).
- `FR-003`: `shared/services/catalog-service.ts` is deleted.
- `FR-004`: The catalog service reference moves to `composition/`; only the app container sets it.
- `FR-005`: All import sites updated; `tsc --noEmit` passes.
- `NFR-001` (listed under FR for traceability): No class with `register()` or mutable module-level state remains in `core/`.

## Non-Functional Requirements

- `NFR-001`: `core/` zone passes the boundary rule: zero imports of browser APIs, framework modules, or mutable adapter state.
- `NFR-002`: `shared/` zone passes the boundary rule: zero mutable module-level exports.

## Observability Requirements

- `OBS-001`: Not applicable — no telemetry behavior changes; capability registration events defined in `observability-events.ts` are not moved.

## Acceptance Criteria

- `AC-001`: **Given** the refactored codebase, **When** `grep -r 'class CapabilityRegistry' src/core` runs, **Then** no results are found.
- `AC-002`: **Given** the refactored codebase, **When** `grep -r 'catalog-service' src/shared` runs, **Then** no results are found.
- `AC-003`: **Given** a client-only deployment, **When** the capability snapshot is read from the app container, **Then** all registered capabilities (CSV, JSON, Parquet, chart types) are present.
- `AC-004`: **Given** a core use case unit test, **When** it runs without importing `composition/` or `adapters/`, **Then** it passes — CORE is free of composition imports.

## Required Tests

### Unit Tests

- `UT-001`: Verify that `CapabilityRegistry` at its new path registers a capability and returns it via `getCapability`. Covers `FR-001`, `AC-003`.
- `UT-002`: Verify that `CapabilityRegistry.requireCapability` throws a descriptive error when a capability is not registered. Covers `FR-001`.

### Integration Tests

- `IT-001`: **Scenario**: Platform capabilities are available through the client-only container  
  **Given** the client-only composition container is initialized  
  **When** `capabilitySnapshot.supports('datasource-connector', 'csv')` is called  
  **Then** it returns `true`  
  Covers `FR-001`, `AC-003`.

### Smoke Tests

- `SMK-001`: Not applicable — capability registration is verified by the integration test above; no deploy-specific startup check is needed.

### End-to-End Tests

- `E2E-001`: Not applicable — no user journey changes; only internal file paths change.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to registry placement.

### Performance Tests

- `PT-001`: Not applicable — this task only moves files; no runtime performance characteristics change.

### Security Tests

- `ST-001`: Not applicable — this task does not touch authentication, authorization, input handling, or secrets.

### Usability Tests

- `UX-001`: Not applicable — no user-visible behavior changes.

### Observability Tests

- `OT-001`: Not applicable — observability event names in `observability-events.ts` are not moved; no telemetry behavior changes.

## Definition of Done

- Code is implemented; `core/platform/` is type-only; `shared/services/` does not exist.
- Required tests pass (`UT-001`, `UT-002`, `IT-001`).
- ESLint boundary rules pass; `tsc --noEmit` passes.
- ADR 002 open question about registry placement is answered in the ADR document.
