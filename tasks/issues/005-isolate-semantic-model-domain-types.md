---
id: "005"
created: 2026-05-24
updated: 2026-05-24
status: active
---

# Task: Isolate Semantic Model and Ask Data domain types

## Priority

P1 — Needed to make Ask Data extensible and testable without coupling core contracts to search/modeling libraries.

## Dependencies

- Depends on Task 001: Map architecture boundaries and fitness rules.
- Depends on Task 002: Define BI platform contracts and capabilities.
- Depends on Task 004: Inject query and Ask Data ports instead of global DB services.
- Depends on ADR `docs/adrs/001-define-clean-architecture-boundaries.md`.
- Depends on ADR `docs/adrs/002-establish-bi-extension-platform.md`.

## Assignability

**AFK** — the required direction is defined by ADRs 001 and 002; implementation can proceed through compatibility types and tests.

## Context

`core/entities/ask.ts` currently re-exports `shared/types/ask.ts`, and `shared/types/ask.ts` imports Fuse and MiniSearch types. Ask Data is a core BI capability, but search engine and embedding library choices are volatile implementation details. This task separates stable semantic model and Ask Data contracts from library-specific runtime internals.

## Use Cases

- **Feature**: Semantic model portability
- **Scenario**: Developer replaces semantic matching strategy
- **Given** a new semantic matcher implementation is added
- **When** it implements the semantic model contracts
- **Then** core Ask Data use cases do not import the matcher library or change their public response contract

## Definition of Ready

- Task 002 defines extension contracts for semantic model providers and Ask Data strategies.
- Task 004 removes direct UI dependency on global DB access for Ask Data execution.
- Existing Ask Data tests are passing before type extraction starts.

## Functional Requirements

- `FR-001`: Move stable Ask Data request/response, Semantic Model, field, entity, relationship, intent, and result-shape types into core/application or core/domain modules.
- `FR-002`: Keep Fuse, MiniSearch, Transformers.js, and chrono-specific types in adapter or implementation modules outside the stable core contracts.
- `FR-003`: Provide temporary compatibility exports for existing modules during migration, with clear deprecation comments.
- `FR-004`: Ensure Ask Data use cases depend on stable `AskEngine` or strategy ports, not concrete `AskDataEngine` internals.

## Non-Functional Requirements

- `NFR-001`: Core type modules must compile in a Node test environment without optional browser/model/search libraries.
- `NFR-002`: Public Ask Data contracts must remain less volatile than parser, matcher, and SQL planner internals.
- `NFR-003`: Type extraction must be mechanical where possible and avoid changing Ask Data behavior.

## Observability Requirements

- `OBS-001`: Not applicable — this task changes type boundaries and contracts, not runtime telemetry.

## Acceptance Criteria

- `AC-001`: **Given** `core/entities` and `core/application` files, **When** imports are inspected, **Then** they do not import `shared/types/ask`, Fuse, MiniSearch, Transformers.js, or chrono modules.
- `AC-002`: **Given** existing Ask Data unit tests, **When** they run, **Then** parser, planner, matcher, and narrative behavior remains unchanged.
- `AC-003`: **Given** an adapter-specific matcher needs Fuse or MiniSearch types, **When** it compiles, **Then** those types are contained outside stable core contracts.

## Required Tests

### Unit Tests

- `UT-001`: Type-level or compile-time test proving core Ask Data contracts can be imported without external search/model libraries. Covers `FR-001`, `FR-002`.
- `UT-002`: Existing parser/planner/matcher tests continue to pass after type relocation. Covers `FR-003`.

### Integration Tests

- `IT-001`: **Scenario**: Ask Data executes through stable contracts  
  **Given** an Ask Data use case with a fake Ask Engine  
  **When** a question is executed  
  **Then** the response matches the stable core contract  
  Covers `FR-004`.

### Smoke Tests

- `SMK-001`: Run `npm run typecheck` to catch broken compatibility exports. Covers `FR-003`.

### End-to-End Tests

- `E2E-001`: Not applicable — behavior should remain unchanged and is covered by existing Ask Data flows.

### Regression Tests

- `REG-001`: **Scenario**: Ask Data parser behavior is preserved  
  **Given** existing Ask Data fixture questions  
  **When** tests run after type extraction  
  **Then** generated intents and SQL plans remain equivalent  
  Covers behavior-preservation risk.

### Performance Tests

- `PT-001`: Not applicable — type relocation does not change runtime algorithm paths.

### Security Tests

- `ST-001`: Not applicable — no input handling or trust boundary changes.

### Usability Tests

- `UX-001`: Not applicable — no UI changes.

### Observability Tests

- `OT-001`: Not applicable — runtime telemetry is unchanged.

## Definition of Done

- Code is implemented behind the correct domain, service, component, or adapter boundary.
- Required tests for this task pass.
- Loading, empty, validation, server error, and permission-denied states are handled where applicable.
- Required telemetry is implemented and verified.
- Required ADRs are updated from `Proposed` to `Accepted` or left with explicit open questions.
- API contracts, user-facing behavior, ADRs, or operational runbooks are documented when changed.
