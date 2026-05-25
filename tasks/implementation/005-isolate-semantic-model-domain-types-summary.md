---
id: '005'
issue: 'tasks/issues/005-isolate-semantic-model-domain-types.md'
created: 2026-05-25
updated: 2026-05-25
---

# Implementation Summary: Isolate Semantic Model Domain Types

## Related Task

- `tasks/issues/005-isolate-semantic-model-domain-types.md`

## Files Changed

- `src/core/entities/ask.ts` — moved stable Ask Data response, intent, result-shape, Semantic Model, field, entity, relationship, and parse option contracts into core.
- `src/core/entities/index.ts` — exported stable Ask Data and Semantic Model contracts from the core entity barrel.
- `src/core/application/ports/ask-engine.ts` — changed the Ask Engine port to depend only on core contracts.
- `src/shared/types/ask.ts` — kept deprecated compatibility types for existing feature modules and left Fuse/MiniSearch-specific aliases outside core.
- `src/core/entities/ask.spec.ts` — added a compile-time-oriented unit test for core Ask Data and Semantic Model contracts.
- `src/core/application/use-cases/ask-data/ask-data.spec.ts` — added an integration-style use-case test with a fake Ask Engine returning the stable response contract.

## Behavior Implemented

- Core Ask Data contracts can be imported from `@/core/entities/ask` without importing Fuse, MiniSearch, Transformers.js, or chrono modules.
- `AskEngine` and the `AskData` use case now depend on stable core Ask Data contracts instead of `shared/types/ask`.
- Existing feature modules can continue importing compatibility types from `shared/types/ask` during migration.
- Runtime Ask Data parser, planner, matcher, and narrative behavior was not intentionally changed.

## Design Notes

- The stable contract copy in `shared/types/ask.ts` is intentionally deprecated rather than implemented as a re-export because repository boundary lint rules disallow `shared` importing `core`.
- Fuse and MiniSearch type aliases remain only in `shared/types/ask.ts`, which is outside stable core contracts.
- No ADR status changes were made because ADR 001 and ADR 002 still have explicit open questions requiring human approval.
- The change was kept mechanical and avoided broad migration of all feature-level Ask Data imports.

## Tests Added or Updated

- `src/core/entities/ask.spec.ts` — verifies stable Ask Data and Semantic Model contracts can be used from core without matcher library imports.
- `src/core/application/use-cases/ask-data/ask-data.spec.ts` — verifies Ask Data executes through a fake `AskEngine` and returns the stable response contract.

## Test Categories Not Applicable

- `E2E`: Not applicable — this task changes type boundaries and is covered by existing Ask Data unit flows plus typecheck.
- `Performance`: Not applicable — type relocation does not change runtime algorithm paths.
- `Security`: Not applicable — no input handling, authorization, or trust boundary behavior changed.
- `Usability`: Not applicable — no UI behavior changed.
- `Observability`: Not applicable — runtime telemetry was unchanged.

## Validation Run

```text
npm run test:unit -- src/core/entities/ask.spec.ts src/core/application/use-cases/ask-data/ask-data.spec.ts src/features/ask/model/ask-data.spec.ts src/features/ask/model/question-parser.spec.ts src/features/ask/model/sql-planner.spec.ts src/features/ask/model/semantic-field-matcher.spec.ts — passed, 6 files / 90 tests
npm run typecheck — passed
npm run lint — failed on pre-existing boundary violation in src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts importing composition
```

## Accessibility Notes

- Not applicable — this task does not change frontend UI, markup, keyboard behavior, focus behavior, labels, or error states.

## Observability Changes

- Not applicable — this task changes type boundaries and contracts, not logs, metrics, traces, or analytics.

## ADR Updates

- Not applicable — implementation follows ADR 001 and ADR 002 direction but does not resolve their open questions.

## Unresolved Assumptions or Follow-Up

- `npm run lint` still fails because `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts` imports `@/composition/client-only-container`, which violates existing boundary rules and is unrelated to this task.
- Follow-up migration can replace remaining feature-level imports from `shared/types/ask` with `@/core/entities/ask`.
