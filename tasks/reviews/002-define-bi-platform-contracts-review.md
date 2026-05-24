---
id: "002"
issue: "tasks/issues/002-define-bi-platform-contracts.md"
created: 2026-05-24
updated: 2026-05-24
---

# Review: Define BI platform contracts and capabilities

## Related Task

- `tasks/issues/002-define-bi-platform-contracts.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

None.

## AC Evaluation

| AC | Result | Notes |
|----|--------|-------|
| AC-001 | Pass | Platform contracts live in `src/core/platform` and import only core entity types; `npm run typecheck` and the Node unit tests passed without browser, UI, or database runtime requirements. |
| AC-002 | Pass | `CapabilityRegistry.getContributions()` returns role-specific contributions by shared `ContributionType`, and `src/core/platform/capability-registry.spec.ts` registers two datasource connectors plus a query executor polymorphically. |
| AC-003 | Pass | `CapabilityRegistry.listAvailableCapabilities()` filters out disabled capability snapshots while `listCapabilities()` preserves enabled state; covered by `src/core/platform/capability-registry.spec.ts`. |
| AC-004 | Pass | Existing composition behavior remains covered by `src/composition/composition.spec.ts`; full unit suite passed with 52 files and 717 tests. |

## Test Coverage Evaluation

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit (UT-001) | Present | `src/core/platform/capability-registry.spec.ts` verifies multiple capability registration, lookup by ID, and lookup by contribution type. |
| Unit (UT-002) | Present | `src/core/platform/capability-registry.spec.ts` verifies duplicate IDs throw `DuplicateCapabilityError` with deterministic message content. |
| Unit (UT-003) | Present | `src/core/platform/capability-registry.spec.ts` scans platform source files for forbidden UI, adapter, infra, and external-library imports. |
| Integration (IT-001) | Present | `src/composition/platform-capabilities.spec.ts` verifies a built-in datasource connector registers through the platform registry and is exposed through the platform contract. |
| Smoke (SMK-001) | Present | `npm run typecheck` passed. |
| E2E (E2E-001) | Not applicable | Task states this introduces contracts and does not change a complete user journey. |
| Regression (REG-001) | Not applicable | Task states no known previous defect is targeted. |
| Performance (PT-001) | Not applicable | Task states registry operations are in-memory and not performance-sensitive at current scale. |
| Security (ST-001) | Present | `src/core/platform/capability-registry.spec.ts` verifies UI-safe capability serialization excludes secret-like extra fields. |
| Usability (UX-001) | Not applicable | Task states there are no user-facing UI changes. |
| Observability (OT-001) | Not applicable | Task states event emission is handled later; this task defines event names only. |

## Observability Evaluation

| OBS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| OBS-001 | Define observability event names for capability registration success and failure, without requiring runtime event emission. | Met | `src/core/platform/observability-events.ts` defines `platform.capability.registration.succeeded` and `platform.capability.registration.failed`; unit coverage verifies both names. |
| OBS-002 | Capability metadata must not include secrets, datasource credentials, or full SQL bodies. | Met | `src/core/platform/capability-registry.ts` emits capability snapshots by explicit allowlist fields only; `ST-001` verifies extra `apiKey`, `credentials`, and `sql` fields are omitted. |

## ADR Compliance

| ADR | Required Action | Status |
|-----|-----------------|--------|
| `docs/adrs/001-define-clean-architecture-boundaries.md` | Updated from Proposed to Accepted or left with explicit open questions. | Done — remains `Proposed` with explicit open questions. |
| `docs/adrs/002-establish-bi-extension-platform.md` | Updated from Proposed to Accepted or left with explicit open questions. | Done — remains `Proposed` with explicit human approval and future sandboxing questions. |

## Convention Notes

None.

## Unresolved Assumptions or Follow-Up

- ADR 002 remains HITL and cannot move to `Accepted` until human approval of the first public Extension Point contract.
- Runtime observability emission remains intentionally deferred to the later observability boundary task.

