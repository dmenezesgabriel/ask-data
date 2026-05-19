---
id: '008'
created: 2026-05-18
updated: 2026-05-18
status: active
---

# Task: Enforce Import Boundary Rules

## Priority

P4 — Must run after all structural tasks (003–007) are complete so that no in-progress violations exist. Locks in the architecture permanently.

## Dependencies

- Depends on Task 007: Add Composition Containers (`tasks/issues/007-add-composition-containers.md`).
- Depends on ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` — the ADR must be `Accepted` before rules are written, because the rules are derived directly from the ADR decision.

## Assignability

**AFK** — All zone definitions and allowed-import rules are derivable from ADR 004. Violations are reported by ESLint; fixing them is mechanical once the rules are active.

## Context

After Tasks 003–007, the architecture layers exist in code but nothing prevents a developer from importing an adapter directly from a feature, or a use case from a Lit element. `eslint-plugin-boundaries` will enforce the final dependency direction at lint time, making violations a CI error.

Zones to declare:

| Zone          | Pattern              |
| ------------- | -------------------- |
| `core`        | `src/core/**`        |
| `adapters`    | `src/adapters/**`    |
| `composition` | `src/composition/**` |
| `features`    | `src/features/**`    |
| `infra`       | `src/infra/**`       |
| `shared`      | `src/shared/**`      |
| `app`         | `src/app/**`         |

Allowed import matrix:

| Zone          | May import from                                  |
| ------------- | ------------------------------------------------ |
| `core`        | `core`, `shared` (pure utils only)               |
| `adapters`    | `core`, `shared`                                 |
| `features`    | `core`, `shared`, `features` (same feature only) |
| `composition` | `core`, `adapters`, `features`, `shared`         |
| `app`         | `composition`, `features`, `shared`              |
| `infra`       | `core`, `shared`                                 |

`features` must not import from `adapters`, `composition`, `infra`, or peer features (cross-feature imports go through `core` entities only).

## Use Cases

- **Feature**: Boundary enforcement
- **Scenario**: Developer accidentally imports a localStorage adapter from a feature component
- **Given** `eslint-plugin-boundaries` is configured and CI runs ESLint
- **When** the developer pushes code with a forbidden import
- **Then** ESLint reports an error and the CI pipeline fails before the PR is merged

---

- **Feature**: Boundary enforcement
- **Scenario**: Legitimate core-to-core import is allowed
- **Given** `src/core/application/use-cases/ask-data/ask-data.ts` imports from `src/core/application/ports/`
- **When** ESLint runs
- **Then** no boundary error is reported

## Definition of Ready

- Tasks 003–007 complete: all layers exist and the architecture is fully wired.
- ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` is `Accepted`.
- `eslint-plugin-boundaries` is available as a dev dependency.
- The zone pattern table above is reviewed and approved.

## Functional Requirements

- `FR-001`: `eslint-plugin-boundaries` is installed as a dev dependency.
- `FR-002`: The six import zones defined above are declared in `eslint.config.js`.
- `FR-003`: The allowed-import matrix is configured as `boundaries/element-types` rules with severity `error`.
- `FR-004`: ESLint reports zero boundary violations on the post-Task-007 codebase.
- `FR-005`: A deliberate test import (a feature importing an adapter) is added and confirmed to produce an ESLint error, then removed.
- `FR-006`: The ESLint boundary check is added to the CI pipeline (or already runs via the existing lint step).

## Non-Functional Requirements

- `NFR-001`: The lint check completes in under 30 seconds on a full codebase run.
- `NFR-002`: Adding a new file to any zone automatically inherits the zone's boundary rules without manual configuration.

## Observability Requirements

- `OBS-001`: Not applicable — lint rules have no runtime telemetry surface.

## Acceptance Criteria

- `AC-001`: **Given** a file in `src/core/` importing from `src/adapters/`, **When** ESLint runs, **Then** a `boundaries/element-types` error is reported.
- `AC-002`: **Given** a file in `src/features/ask/` importing from `src/adapters/`, **When** ESLint runs, **Then** a `boundaries/element-types` error is reported.
- `AC-003`: **Given** the full codebase after Task 007, **When** ESLint runs with the new rules, **Then** zero boundary violations are reported.
- `AC-004`: **Given** `src/composition/app-container.ts` importing from `src/adapters/` and `src/core/`, **When** ESLint runs, **Then** no boundary error is reported.

## Required Tests

### Unit Tests

Not applicable — boundary rules are enforced by the linter, not runtime code.

### Integration Tests

Not applicable — linting is a static analysis step, not a runtime integration.

### Smoke Tests

- `SMK-001`: **Scenario**: ESLint with boundary rules runs without configuration error  
  **Given** `eslint-plugin-boundaries` is installed and configured  
  **When** `eslint src/` is executed  
  **Then** it exits with code 0 (after all violations are fixed)  
  Covers `FR-004`.

### End-to-End Tests

Not applicable — no user-facing behavior changes.

### Regression Tests

Not applicable — no known previous defect in this area.

### Performance Tests

Not applicable — lint performance is acceptable under `NFR-001`; no benchmark harness needed.

### Security Tests

Not applicable — boundary enforcement is not a security boundary.

### Usability Tests

Not applicable — no user-facing changes.

### Observability Tests

Not applicable — no telemetry changes.

## Definition of Done

- `eslint-plugin-boundaries` is installed and configured in `eslint.config.js`.
- `SMK-001` passes: `eslint src/` exits with code 0.
- `AC-001` and `AC-002` validated manually (test import added and confirmed to error, then removed).
- CI pipeline includes the lint step (or confirms it was already included).
- ADR `docs/adrs/004-hexagonal-architecture-boundaries.md` updated to `Accepted`.
