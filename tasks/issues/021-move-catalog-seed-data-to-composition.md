---
id: '021'
created: 2026-05-29
updated: 2026-05-29
status: active
---

# Task: Move catalog seed data from features/catalog/ to composition

## Priority

P0 — Unblocks tasks 023–026 by eliminating the only `features/ → adapters/` import, which ESLint boundary rules must reject. Fixing the most direct violation first keeps the boundary rule enforceable while other tasks run.

## Dependencies

- No task dependency; can start immediately.
- No ADR dependency; this task moves wiring to its correct home without changing any contract.

## Assignability

**AFK** — all requirements and acceptance criteria are resolved; the move is purely mechanical with no open architectural decisions.

## Context

`features/catalog/data/seeded-catalog-repositories.ts` wraps `LocalStorageDashboardRepository`, `LocalStorageQuestionRepository`, and `LocalStorageDatasourceRepository` with seeded YAML data. This makes a feature module a direct consumer of concrete adapter classes — a boundary violation: features must depend only on ports, never on the adapters that implement them.

Seeding is a deployment/composition concern. The right home is `composition/client-only-container.ts`, which already owns client-only adapter selection. The fix is to inline the seeding wrappers into the client-only container and delete `features/catalog/data/`.

## Use Cases

- **Feature**: Client-only catalog seeding
- **Scenario**: Developer launches Portable BI in client-only mode for the first time
- **Given** no catalog data exists in localStorage
- **When** the app initializes through the client-only composition container
- **Then** the seeded datasources, questions, and dashboards are available in the catalog

## Definition of Ready

- `composition/client-only-container.ts` and its `SeededDashboardRepository` / `SeededQuestionRepository` / `SeededDatasourceRepository` wiring patterns are understood.
- ESLint boundary configuration at `architecture-boundaries.config.cjs` is known so it can be updated to reject the now-removed cross-zone import.

## Functional Requirements

- `FR-001`: Seeded YAML data is loaded during client-only composition, not inside any file under `features/`.
- `FR-002`: `features/catalog/data/` directory is deleted.
- `FR-003`: No file under `features/` imports from `adapters/` directly.
- `FR-004`: Existing seeded catalog entries (datasources, questions, dashboards) are available after a fresh client-only start.

## Non-Functional Requirements

- `NFR-001`: Client-only deployment starts with the same seeded data as before this task; no catalog entries are lost or changed.
- `NFR-002`: ESLint boundary rules reject any new `features/ → adapters/` import after this task.

## Observability Requirements

- `OBS-001`: Not applicable — seeding is a startup initialization detail with no user-facing telemetry requirement.

## Acceptance Criteria

- `AC-001`: **Given** a fresh localStorage, **When** the client-only container initializes, **Then** `listDatasources`, `listQuestions`, and `listDashboards` return the seeded entries.
- `AC-002`: **Given** the refactored codebase, **When** ESLint runs, **Then** no `features/ → adapters/` import error appears.
- `AC-003`: **Given** the refactored codebase, **When** `find src/features/catalog/data` runs, **Then** no such path exists.

## Required Tests

### Unit Tests

- `UT-001`: Verify that the seeded dashboard repository returns the expected seeded dashboards when localStorage is empty. Covers `FR-004`, `AC-001`.
- `UT-002`: Verify that the seeded datasource repository returns the expected seeded datasources when localStorage is empty. Covers `FR-004`, `AC-001`.
- `UT-003`: Verify that the seeded question repository returns the expected seeded questions when localStorage is empty. Covers `FR-004`, `AC-001`.

### Integration Tests

- `IT-001`: **Scenario**: Client-only composition delivers seeded catalog through use cases  
  **Given** a fresh in-memory localStorage stub  
  **When** the client-only container is created and `listDatasources.execute()` is called  
  **Then** the returned datasources match the seeded YAML entries  
  Covers `FR-001`, `AC-001`.

### Smoke Tests

- `SMK-001`: Not applicable — seeding is not a deploy-time availability check; it is covered by the integration test.

### End-to-End Tests

- `E2E-001`: Not applicable — no user journey changes; only the internal wiring location changes.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect related to seeding placement.

### Performance Tests

- `PT-001`: Not applicable — seeding is a one-time startup operation with no measurable performance risk.

### Security Tests

- `ST-001`: Not applicable — this task does not touch authentication, authorization, input handling, or secrets.

### Usability Tests

- `UX-001`: Not applicable — no user-visible behavior changes.

### Observability Tests

- `OT-001`: Not applicable — this task does not introduce or modify operationally relevant behavior.

## Definition of Done

- Code is implemented behind the correct composition boundary; no file in `features/` imports from `adapters/`.
- Required tests pass (`UT-001–003`, `IT-001`).
- `features/catalog/data/` directory does not exist.
- ESLint boundary rules pass with no new exemptions added.
- `tsc --noEmit` passes.
