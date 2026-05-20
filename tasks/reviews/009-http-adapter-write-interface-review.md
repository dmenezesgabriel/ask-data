---
id: '009'
issue: 'tasks/issues/009-http-adapter-write-interface.md'
created: 2026-05-19
updated: 2026-05-19
---

# Review: HTTP Adapter Write Interface — Eliminate Silent NotImplementedError

## Related Task

- `tasks/issues/009-http-adapter-write-interface.md`

## Overall Verdict

**Pass**

No Blocking findings. Two Non-blocking findings and two Suggestions that do not prevent mark-complete.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                         | Evidence                                                  |
| ----- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| F-001 | Non-blocking | FR-003      | `app-container.ts` still casts `createClientServerContainer() as unknown as AppContainer`, hiding the narrower `ClientServerContainer` type from all consumers. The factory's own return type is correct; the cast is Task 002 scope per the task's own text.                       | `src/composition/app-container.ts:8`                      |
| F-002 | Non-blocking | —           | `src/adapters/http/http-error.ts` (`NotImplementedError`) is now dead code — nothing imports it. `knip` will flag it on the next dead-code sweep. The implementation summary documents this but does not remove it.                                                                 | `src/adapters/http/http-error.ts`                         |
| F-003 | Non-blocking | —           | ADR 007 still contains an "Open Questions" section asking "Does a server-side API exist?" — a question the decision itself answers (no). The section should be closed or removed to avoid confusion for future readers.                                                             | `docs/adrs/007-http-adapter-write-interface.md:56-58`     |
| F-004 | Suggestion   | UT-001      | The UT-001 tests use runtime `'save' in repo` checks. These test JavaScript prototype presence, not TypeScript types. A stronger companion check using `expectTypeOf(repo).not.toMatchTypeOf<{ save: unknown }>()` would catch any future accidental re-addition at the type level. | `src/adapters/http/http-datasource-repository.spec.ts:29` |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                           |
| ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `npm run typecheck` exits clean. No type errors in any HTTP adapter, use case, or container.                                                                                                                                                                                                    |
| AC-002 | Pass   | `HttpDatasourceRepository` no longer implements `DatasourceRepository`. Passing it to `new CreateDatasource(httpDatasourceRepo, ...)` would produce a compile-time error (`save`/`delete` missing). The `client-server-container.ts` removes all write use cases, confirming the design intent. |
| AC-003 | Pass   | All three HTTP adapters expose only `list()` and `get()`. Neither method throws `NotImplementedError`. `NotImplementedError` is unreferenced by any adapter (see F-002 for the dead-code residue).                                                                                              |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                                                                  |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present        | `src/adapters/http/http-datasource-repository.spec.ts`, `…question…`, `…dashboard…` — checks `'save' in repo` and `'delete' in repo` are false for all three adapters. |
| Regression (REG-001) | Present        | Same files — mocked fetch; `list()` returns the expected entity; `get()` returns null on 404. All three adapters covered.                                              |
| Integration          | Not applicable | HTTP adapters tested at unit level with mocked fetch; no real server available in CI. Documented in issue.                                                             |
| Smoke                | Not applicable | No change to application startup. Documented in issue.                                                                                                                 |
| E2E                  | Not applicable | No complete user journey changes without a server. Documented in issue.                                                                                                |
| Performance          | Not applicable | Structural change only; no runtime performance path affected. Documented in issue.                                                                                     |
| Security             | Not applicable | No authentication, authorization, or trust boundary touched. Documented in issue.                                                                                      |
| Usability            | Not applicable | No user-visible behavior change. Documented in issue.                                                                                                                  |
| Observability        | Not applicable | No new telemetry paths added. Documented in issue.                                                                                                                     |

## Observability Evaluation

| OBS ID  | Requirement                                                                               | Status | Notes                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| OBS-001 | Existing HTTP error logging in the adapters is sufficient; no new observability required. | Met    | `list()` and `get()` retain their `throw new Error(...)` on non-200/404 responses. No telemetry removed. |

## ADR Compliance

| ADR                                             | Required Action                                                                   | Status |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| `docs/adrs/007-http-adapter-write-interface.md` | Updated from Proposed to Accepted; Decision section filled in with chosen option. | Done   |

Note: ADR heading reads "ADR 002" while the filename is `007-http-adapter-write-interface.md`. This heading/filename mismatch is **pre-existing** and not introduced by this implementation.

## Convention Notes

- `F-001` — Non-blocking — The `as unknown as AppContainer` cast in `app-container.ts` is a pre-existing issue explicitly assigned to Task 002. The implementation correctly stops short of changing it and documents the gap.
- `F-002` — Non-blocking — `http-error.ts` becoming dead code is a direct consequence of the correct implementation. It should be removed in the same PR or as the first commit of Task 002.
- `F-003` — Non-blocking — The "Open Questions" section in the ADR should be resolved to signal to future readers that the question was answered. Recommend updating to "Resolved: No server-side API exists at this time."
- `F-004` — Suggestion — Runtime prototype checks (`'save' in repo`) are sufficient to satisfy the task's UT-001 spec (option 2). The suggestion to add `expectTypeOf` is an improvement, not a requirement.

## Unresolved Assumptions or Follow-Up

- `src/composition/app-container.ts` cast (`as unknown as AppContainer`) means UI code that calls write use cases in `client-server` mode will receive a runtime `undefined` error rather than a compile-time error. This is explicitly deferred to Task 002.
- `src/adapters/http/http-error.ts` is now unreferenced. It should be deleted — either in a follow-up commit or at the start of Task 002.
- ADR 007 "Open Questions" section should be closed with a brief resolution statement.
