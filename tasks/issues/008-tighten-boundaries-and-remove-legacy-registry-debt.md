---
id: "008"
created: 2026-05-24
updated: 2026-05-24
status: active
---

# Task: Tighten boundaries and remove legacy registry debt

## Priority

P2 — Should run after vertical migrations so enforcement can become strict without breaking working behavior.

## Dependencies

- Depends on Task 003: Unify Datasource, Question, and Dashboard persistence behind use cases.
- Depends on Task 004: Inject query and Ask Data ports instead of global DB services.
- Depends on Task 005: Isolate Semantic Model and Ask Data domain types.
- Depends on Task 006: Add capability registry and feature flag evaluation.
- Depends on Task 007: Add deployment composition contracts.
- Depends on ADR `docs/adrs/001-define-clean-architecture-boundaries.md`.

## Assignability

**AFK** — all behavioral migrations and architecture decisions are completed by prerequisite tasks.

## Context

After the vertical migration tasks, legacy registry APIs, compatibility exports, broad `shared` dependencies, and boundary exceptions should be removed or documented as intentional. This task makes architectural enforcement strict enough to prevent backsliding.

## Use Cases

- **Feature**: Architecture enforcement
- **Scenario**: Developer introduces a shortcut dependency
- **Given** a developer accidentally imports a feature registry from UI or imports `shared/types/ask` from core
- **When** lint and tests run
- **Then** the violation fails fast with a clear boundary error

## Definition of Ready

- Tasks 003 through 007 are complete.
- No production UI path depends on legacy feature registries or global DB service.
- Compatibility exports created during migration have usage lists.

## Functional Requirements

- `FR-001`: Remove unused legacy registry mutation APIs or move them behind seed/repository adapters with explicit internal visibility.
- `FR-002`: Remove compatibility exports for relocated Ask Data and Semantic Model types where consumers have migrated.
- `FR-003`: Tighten ESLint boundary rules so `core` no longer depends on broad `shared` modules.
- `FR-004`: Add architecture tests or import checks for prohibited dependencies: UI to feature data registries, core to shared technical types, and feature UI to infra/adapters.
- `FR-005`: Update architecture documentation to reflect final boundaries and remaining intentional exceptions.

## Non-Functional Requirements

- `NFR-001`: Boundary checks must be fast enough for normal lint workflow.
- `NFR-002`: Remaining exceptions must include owner, reason, and removal condition.
- `NFR-003`: Deleting compatibility code must not remove client-only functionality or seed data.

## Observability Requirements

- `OBS-001`: Not applicable — this task removes architectural debt and tightens static checks, not runtime behavior.

## Acceptance Criteria

- `AC-001`: **Given** source files, **When** imports are scanned, **Then** no UI module imports feature registry data modules directly.
- `AC-002`: **Given** core modules, **When** imports are scanned, **Then** core does not import broad `shared` technical modules.
- `AC-003`: **Given** lint runs, **When** a prohibited boundary fixture is present, **Then** lint fails.
- `AC-004`: **Given** the app runs in client-only mode, **When** seed dashboards, datasources, and questions load, **Then** they remain available after legacy cleanup.

## Required Tests

### Unit Tests

- `UT-001`: Verify import-boundary fixtures for prohibited and allowed dependencies. Covers `FR-004`.

### Integration Tests

- `IT-001`: **Scenario**: Seed BI assets remain available after cleanup  
  **Given** cleaned repository/adapters and no legacy registry UI imports  
  **When** catalog use cases list dashboards, datasources, and questions  
  **Then** YAML seed assets and user assets are returned correctly  
  Covers `FR-001`, `AC-004`.

### Smoke Tests

- `SMK-001`: Run `npm run lint` and `npm run typecheck` to verify tightened rules and removed compatibility exports. Covers `FR-002`, `FR-003`.

### End-to-End Tests

- `E2E-001`: **Scenario**: Main BI navigation still works after architecture cleanup  
  **Given** the app runs in client-only mode  
  **When** the user opens dashboard, question, and datasource sections  
  **Then** each section renders seed and user content as before  
  Covers `AC-004`.

### Regression Tests

- `REG-001`: **Scenario**: Service locator dependency does not return  
  **Given** source files outside composition/adapters  
  **When** imports are scanned  
  **Then** no file imports `shared/services/db-service`  
  Covers prior global DB service debt.

### Performance Tests

- `PT-001`: Not applicable — static checks and cleanup do not affect runtime query/dashboard performance.

### Security Tests

- `ST-001`: Not applicable — no new input, auth, storage, or external communication behavior is introduced.

### Usability Tests

- `UX-001`: Not applicable — no intentional UI behavior changes.

### Observability Tests

- `OT-001`: Not applicable — runtime telemetry is unchanged.

## Definition of Done

- Code is implemented behind the correct domain, service, component, or adapter boundary.
- Required tests for this task pass.
- Loading, empty, validation, server error, and permission-denied states are handled where applicable.
- Required telemetry is implemented and verified.
- Required ADRs are updated from `Proposed` to `Accepted` or left with explicit open questions.
- API contracts, user-facing behavior, ADRs, or operational runbooks are documented when changed.
