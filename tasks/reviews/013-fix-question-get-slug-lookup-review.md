---
id: '013'
issue: 'tasks/issues/013-fix-question-get-slug-lookup.md'
created: 2026-05-28
updated: 2026-05-28
---

# Review: Fix user-created question "not found" when looked up by slug

## Related Task

- `tasks/issues/013-fix-question-get-slug-lookup.md`

## Overall Verdict

**Pass**

No Blocking findings.

## Findings

| ID    | Level        | Requirement | Description                                                                                                                                                                                                                                                                                                                                                                                                       | Evidence                                            |
| ----- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| F-001 | Non-blocking | UT-002      | Duplicate test label: two tests in the spec carry the `UT-002` label. The newly added slug-lookup test (line 101) is the issue-contracted `UT-002`. A pre-existing Clock-port test (line 127) also bears the `UT-002` label — introduced before this task. The collision is not introduced by this diff but it now coexists, making the label ambiguous. Rename the Clock test to a distinct ID (e.g., `UT-003`). | `local-storage-question-repository.spec.ts:101,127` |
| F-002 | Suggestion   | AC-003      | No test exercises the null-return path. AC-003 requires `get('unknown')` to return `null`. The code is correct (`?? null` handles it), but the path is untested. The Required Tests section does not mandate a test for AC-003, so this does not block.                                                                                                                                                           | `local-storage-question-repository.ts:151`          |

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                 |
| ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | UT-001 at line 89 saves a question and retrieves it by `q.id`; asserts `found?.id === question.id`.                                                                   |
| AC-002 | Pass   | UT-002 at line 101 saves a question with `id = 'uuid-123'` and retrieves it by `q.slug`; asserts `found?.id === 'uuid-123'` and `found?.slug === question.slug`.      |
| AC-003 | Pass   | Predicate `q.id === id \|\| q.slug === id` with `?? null` correctly returns `null` when neither field matches. No dedicated unit test exists; see F-002 (Suggestion). |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                   |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present        | `local-storage-question-repository.spec.ts:89` — get by `q.id`                                          |
| Unit (UT-002)        | Present        | `local-storage-question-repository.spec.ts:101` — get by `q.slug` (bug scenario / REG-001)              |
| Regression (REG-001) | Present        | Covered by UT-002 — same scenario: slug lookup on a persisted question returns the question, not null   |
| Integration          | Not applicable | Pure in-memory lookup over a localStorage array; localStorage boundary covered by the module-level mock |
| Smoke                | Not applicable | No deploy-path or startup behavior changed                                                              |
| E2E                  | Not applicable | Narrow adapter predicate change; no full journey impact                                                 |
| Performance          | Not applicable | Single-predicate change; no measurable performance impact                                               |
| Security             | Not applicable | No trust boundary, authentication, or authorization changed                                             |
| Usability            | Not applicable | No UI state changed                                                                                     |
| Observability        | Not applicable | No telemetry added or changed                                                                           |

## Observability Evaluation

Not applicable — no OBS requirements defined in the task (OBS-001 explicitly marked not applicable in the issue).

## ADR Compliance

Not applicable — no ADR dependencies listed in the task.

## Convention Notes

- `F-001` — Non-blocking — The pre-existing Clock test at line 127 carries a `// UT-002` comment and its `it()` label reads `UT-002: save() uses the injected Clock…`. This label predates the current task but now collides with the issue-contracted `UT-002` (slug lookup). The fix pattern itself (`q.id === id || q.slug === id`) is an exact mirror of `LocalStorageDatasourceRepository.get()` line 63 — the prescribed pattern per NFR-002.

## Unresolved Assumptions or Follow-Up

- The duplicate `UT-002` label (F-001) was not introduced by this diff; it exists in the pre-existing spec. A follow-up rename of the Clock test to `UT-003` (or remove the label prefix entirely) would resolve the ambiguity without affecting this task's DoD.
- A null-return test for AC-003 (F-002) could be added as a low-cost hardening step in a follow-up, or appended to this spec in a minor cleanup pass.
