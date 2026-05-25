---
id: '006'
issue: 'tasks/issues/006-add-capability-registry-and-feature-flags.md'
created: 2026-05-25
updated: 2026-05-25
---

# Review: Add capability registry and feature flag evaluation

## Related Task

- `tasks/issues/006-add-capability-registry-and-feature-flags.md`

## Overall Verdict

**Fail**

Blocked by F-001, F-002. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID    | Level        | Requirement     | Description                                                                                                                                                                                                                                                                             | Evidence                                                                                                                 |
| ----- | ------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| F-001 | Blocking     | FR-003 / IT-001 | The exposed `CapabilitySnapshot` is not actually read-only. The array is typed as readonly, but each `Capability` remains mutable at the type level and the snapshot freezes only the outer object and array, not the capability objects passed to UI components and application flows. | `src/core/platform/contracts.ts:11`, `src/core/platform/contracts.ts:19`, `src/core/platform/capability-registry.ts:113` |
| F-002 | Blocking     | REG-001         | The required regression test for seed dashboard chart defaults is missing. Existing tests assert some default chart capabilities exist, but no test opens or validates the dashboard widget editor against chart types used by seed dashboards.                                         | `tasks/issues/006-add-capability-registry-and-feature-flags.md:106`, `src/composition/platform-capabilities.spec.ts:25`  |
| F-003 | Non-blocking | SMK-001         | The smoke test named `SMK-001` still checks only the Dashboard Ask Data UI. It does not verify that dashboard, datasource, and question screens still load with no external flag configuration as required by the task.                                                                 | `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts:11`                                           |
| F-004 | Non-blocking | OT-001          | Observability coverage is partial. Disabled-capability access emission is tested, but registration failure emission/logging with capability ID and contribution type is not verified by a matching observability test.                                                                  | `src/core/platform/capability-registry.spec.ts:127`, `src/core/platform/capability-registry.spec.ts:176`                 |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                                             |
| ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `QuestionEditorPanel` filters visualization options from `CapabilitySnapshot`, so a disabled visualization is not listed when the snapshot omits it. Evidence: `src/features/question/ui/question-editor-panel/question-editor-panel.ts:123`, `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:208`. |
| AC-002 | Pass   | `CreateDatasource` checks datasource connector capabilities and throws `CapabilityDisabledError` for a disabled connector. Evidence: `src/core/application/use-cases/datasources/create-datasource.ts:24`, `src/composition/use-cases.spec.ts:45`.                                                                                |
| AC-003 | Pass   | Default composition creates a registry with default-enabled datasource and visualization capabilities and exposes a snapshot. Evidence: `src/composition/platform-capabilities.ts:40`, `src/composition/client-only-container.ts:46`, `src/composition/platform-capabilities.spec.ts:8`.                                          |
| AC-004 | Pass   | Different static flag adapters produce different deterministic snapshots for the same registered capabilities. Evidence: `src/composition/platform-capabilities.spec.ts:33`.                                                                                                                                                      |

## Test Coverage Evaluation

| Test Category          | Status         | Notes                                                                                                                                                                                                                                                           |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)          | Present        | Static feature flag default behavior is covered in `src/core/platform/capability-registry.spec.ts:104`.                                                                                                                                                         |
| Unit (UT-002)          | Present        | Registry exclusion of flag-disabled capabilities is covered in `src/core/platform/capability-registry.spec.ts:111`.                                                                                                                                             |
| Unit (UT-003)          | Present        | Stable disabled capability domain error is covered in `src/core/platform/capability-registry.spec.ts:127`.                                                                                                                                                      |
| Integration (IT-001)   | Present        | Client-only/default platform composition capabilities are covered in `src/composition/platform-capabilities.spec.ts:8`, but read-only enforcement fails per F-001.                                                                                              |
| Smoke (SMK-001)        | Present        | Existing smoke test runs, but it does not cover all required screens; see F-003.                                                                                                                                                                                |
| E2E (E2E-001)          | Not applicable | The issue marks E2E as not applicable because the tracer migration is capability availability, not a full new user journey.                                                                                                                                     |
| Regression (REG-001)   | Missing        | No matching regression test verifies seed dashboard chart defaults remain available in the dashboard widget editor; see F-002.                                                                                                                                  |
| Performance (PT-001)   | Not applicable | The issue marks performance tests as not applicable because capability resolution is small in-memory configuration.                                                                                                                                             |
| Security (ST-001)      | Present        | Capability metadata serialization excludes secret/config fields in `src/core/platform/capability-registry.spec.ts:147`.                                                                                                                                         |
| Usability (UX-001)     | Present        | Disabled datasource and visualization choices are hidden in component tests at `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts:122` and `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts:208`. |
| Observability (OT-001) | Present        | Partial coverage only; disabled access emission is tested, but registration failure emission/logging is not; see F-004.                                                                                                                                         |

## Observability Evaluation

| OBS ID  | Requirement                                                                                                       | Status | Notes                                                                                                                                                                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS-001 | Emit or log capability registration failures with capability ID and contribution type.                            | Met    | Duplicate registration emits `platform.capability.registration.failed` with capability ID and contribution type through the registry event callback. Evidence: `src/core/platform/capability-registry.ts:55`, `src/core/platform/capability-registry.ts:125`. Test coverage is partial; see F-004. |
| OBS-002 | Emit or log disabled capability access attempts with capability ID and caller context, without user-entered data. | Met    | `requireCapability` emits capability ID, contribution type, and caller only before throwing `CapabilityDisabledError`. Evidence: `src/core/platform/capability-registry.ts:75`, `src/core/platform/capability-registry.spec.ts:127`.                                                               |

## ADR Compliance

| ADR                                                                       | Required Action                                                             | Status |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/adrs/002-establish-bi-extension-platform.md`                        | Updated from `Proposed` to `Accepted` or left with explicit open questions. | Done   | ADR remains `Proposed` with explicit open questions at `docs/adrs/002-establish-bi-extension-platform.md:43`.                        |
| `docs/adrs/004-standardize-feature-flags-and-observability-boundaries.md` | Updated from `Proposed` to `Accepted` or left with explicit open questions. | Done   | ADR remains `Proposed` with explicit open questions at `docs/adrs/004-standardize-feature-flags-and-observability-boundaries.md:42`. |

## Convention Notes

- `F-003` — Non-blocking — The existing smoke-test naming was reused, but the scenario does not match this task's required smoke coverage.
- `F-004` — Non-blocking — Observability assertions are split across unit tests and event-name tests rather than a dedicated `OT-001` test for the full required event behavior.

## Unresolved Assumptions or Follow-Up

- `git diff main...HEAD` could not be used because this checkout uses `master`; review was performed against the current working-tree diff.
- Targeted unit, component, smoke, and typecheck commands passed during review.
