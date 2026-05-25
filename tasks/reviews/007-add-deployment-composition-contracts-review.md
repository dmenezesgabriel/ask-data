---
id: '007'
issue: 'tasks/issues/007-add-deployment-composition-contracts.md'
created: 2026-05-25
updated: 2026-05-25
---

# Review: Add Deployment Composition Contracts

## Related Task

- `tasks/issues/007-add-deployment-composition-contracts.md`

## Overall Verdict

**Fail**

Blocked by F-001, F-002. Implementer must resolve all Blocking findings before mark-complete.

## Findings

| ID    | Level    | Requirement | Description                                                                                                                                                                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                  |
| ----- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001 | Blocking | SMK-001     | The required smoke test for the client-only app shell is missing. The task requires the app to load and the shell to render without composition errors, but no `app-shell` smoke/component test exists and the implementation summary does not list a smoke validation for this scenario.                                                           | `tasks/issues/007-add-deployment-composition-contracts.md:107`, `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts:22`, `tasks/implementation/007-deployment-composition-contracts-summary.md:52` |
| F-002 | Blocking | UX-001      | Read-only deployment mode still renders clickable `Edit` actions for catalog rows. Because `client-server` composition reports catalog write capabilities as unsupported, update/edit actions should not be rendered as clickable UI actions. The added UX test checks create/delete only and would not catch the remaining clickable write action. | `src/shared/ui/collection-list/collection-list.ts:112`, `src/features/datasource/ui/datasource-list/datasource-list.ts:176`, `src/features/datasource/ui/datasource-list/datasource-list.spec.ts:273`                     |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                                            |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `createClientOnlyContainer` returns `deploymentMode: 'client-only'`, DuckDB query execution, top-level CRUD use cases, and supported catalog mutation capabilities. Covered in `src/composition/client-only-container.ts:76` and `src/composition/composition.spec.ts:216`.                                                      |
| AC-002 | Pass   | `createClientServerContainer` uses HTTP repositories/query adapter and reports unsupported catalog write capabilities through explicit operation capability snapshots and unsupported mutation objects. Covered in `src/composition/client-server-container.ts:25` and `src/composition/composition.spec.ts:250`.                |
| AC-003 | Pass   | `createServerlessComposition` uses memory adapters, and `handleServerlessCatalogRequest` invokes a catalog use case through `ApplicationComposition` without browser APIs. Covered in `src/composition/serverless-composition.ts:49`, `src/composition/serverless-handler.ts:15`, and `src/composition/composition.spec.ts:280`. |
| AC-004 | Pass   | Unknown runtime modes deterministically default to `client-only` with a documented warning; documentation records that policy. Covered in `src/composition/runtime-mode.ts:11`, `src/composition/application-composition.spec.ts:36`, and `docs/deployment-composition.md:11`.                                                   |

## Test Coverage Evaluation

| Test Category          | Status              | Notes                                                                                                                                                                                                         |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)          | Present             | `src/composition/application-composition.spec.ts:13` verifies supported and unsupported operation capabilities.                                                                                               |
| Unit (UT-002)          | Present             | `src/composition/application-composition.spec.ts:36` verifies known and unknown runtime mode parsing.                                                                                                         |
| Integration (IT-001)   | Present             | `src/composition/composition.spec.ts:216` verifies client-only composition exposes catalog writes and DuckDB query support.                                                                                   |
| Integration (IT-002)   | Present             | `src/composition/composition.spec.ts:250` verifies client-server HTTP reads/query and unsupported write capabilities.                                                                                         |
| Integration (IT-003)   | Present             | `src/composition/composition.spec.ts:280` verifies the serverless-style handler invokes the same application contract with memory adapters and no browser APIs.                                               |
| Smoke (SMK-001)        | Missing             | No smoke test verifies the client-only app shell loads and renders without composition errors after these composition changes. See F-001.                                                                     |
| E2E                    | Not applicable      | The issue marks E2E as not applicable because this task changes composition contracts, not a new user journey.                                                                                                |
| Regression (REG-001)   | Present             | `src/composition/application-composition.spec.ts:36` covers deterministic unknown runtime mode fallback.                                                                                                      |
| Performance            | Not applicable      | The issue marks performance tests as not applicable because composition startup is not expected to be performance-sensitive.                                                                                  |
| Security (ST-001)      | Present             | `src/composition/composition.spec.ts:308` verifies startup logs do not include endpoint secrets, datasource URLs, tokens, or full configuration objects.                                                      |
| Usability (UX-001)     | Present but failing | `src/features/datasource/ui/datasource-list/datasource-list.spec.ts:258` verifies create/delete hiding, but the implementation still renders clickable edit actions for unsupported update writes. See F-002. |
| Observability (OT-001) | Present             | `src/composition/composition.spec.ts:308` verifies startup logs selected deployment mode and capability IDs only.                                                                                             |

## Observability Evaluation

| OBS ID  | Requirement                                                                                         | Status | Notes                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS-001 | Composition startup must log selected deployment mode and enabled capability IDs without secrets.   | Met    | `logCompositionStartup` logs deployment mode, platform capability IDs, and supported operation capability IDs only; `src/composition/composition.spec.ts:308` verifies the client-only startup payload excludes tokens and URLs. |
| OBS-002 | Serverless-style entrypoint failures must include operation name and correlation ID when available. | Met    | `handleServerlessCatalogRequest` logs `serverless.operation.failed` with `operationName` and `correlationId` in the catch path at `src/composition/serverless-handler.ts:25`.                                                    |

## ADR Compliance

| ADR                                                           | Required Action                                                         | Status                                                                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `docs/adrs/003-keep-deployment-mode-as-composition-detail.md` | Updated from Proposed to Accepted or left with explicit open questions. | Done — status is `Accepted`, and the ADR records `ApplicationComposition` as the shared deployment boundary. |

## Convention Notes

None.

## Unresolved Assumptions or Follow-Up

- Review used `git diff` and direct file inspection because `git diff main...HEAD` failed locally; `main` is not available as a revision in this workspace.
- Validation commands run during review: `npm run test:unit -- --run src/composition/application-composition.spec.ts src/composition/composition.spec.ts`, `npm run test:components -- --run src/features/datasource/ui/datasource-list/datasource-list.spec.ts`, `npm run typecheck`, `npm run lint`, and `npm run build` all passed. `npm run build` emitted existing Vite chunk-size/dynamic-import warnings.
