---
id: '003'
issue: 'tasks/issues/003-unify-catalog-persistence-use-cases.md'
created: 2026-05-24
updated: 2026-05-24
---

# Implementation Summary: Unify Catalog Persistence Use Cases

## Related Task

- `tasks/issues/003-unify-catalog-persistence-use-cases.md`

## Files Changed

- `src/features/datasource/ui/*`, `src/features/question/ui/*`, and `src/features/dashboard/ui/*` — route list, editor, picker, and dashboard editor load paths through use-case-backed catalog services instead of feature registry services.
- `src/shared/services/catalog-service.ts` and `src/composition/app-container.ts` — provide a boundary-safe catalog service bridge initialized from composition.
- `src/features/dashboard/model/dashboard-entity-mapper.ts` — maps use-case Dashboard entities to legacy `DashboardConfig` render data for existing dashboard UI compatibility.
- `src/core/application/use-cases/**` — adds deterministic Dashboard ids and mutation success/failure observability for Datasource, Question, and Dashboard create/update/delete flows.
- `src/adapters/client/local-storage/local-storage-question-repository.ts` — migrates embedded legacy question datasources into the use-case-backed Datasource repository storage path.
- `src/composition/use-cases-integration.spec.ts` and `src/features/datasource/ui/datasource-list/datasource-list.spec.ts` — add required integration, regression, observability, redaction, and UI state coverage.

## Behavior Implemented

- Datasource, Question, and Dashboard list/get/update/delete UI paths now use application use cases and repository ports via the catalog service bridge.
- Seed and user Datasources appear through `SeededDatasourceRepository`; user-created Questions survive reload through `SeededQuestionRepository`; legacy dashboards remain available through `SeededDashboardRepository`.
- YAML-seeded Datasource, Question, and Dashboard records are protected from mutation through use-case-backed flows.
- Datasource, Question, and Dashboard creation now generates deterministic unique slugs/ids when names collide.
- Catalog mutation success/failure logs include asset type, operation, and result without logging datasource URLs, SQL bodies, or full dashboard JSON.

## Design Notes

- Seed decorators live under `features/catalog/data` because adapter-layer code cannot import feature YAML/parsers under the existing architecture boundary rules.
- Repository ports were not changed; decorators satisfy the existing `DatasourceRepository`, `QuestionRepository`, and `DashboardRepository` contracts.
- Existing Dashboard UI still consumes `DashboardConfig`, so the use-case Dashboard entity is converted at the feature boundary while persistence remains use-case-backed.
- Feature UI imports the shared catalog service bridge instead of composition directly to preserve architecture boundary rules.

## Tests Added or Updated

- `UT-001/IT-001`: seed plus user Datasource listing through use cases and localStorage reload.
- `UT-002/REG-001`: YAML-seeded Datasource, Question, and Dashboard deletion is rejected through use cases.
- `UT-003`: deterministic unique Datasource, Question, and Dashboard slug/id generation.
- `IT-002`: user-created Question survives reload through the seeded Question repository path.
- `IT-003`: legacy dashboard storage remains visible through the Dashboard repository path.
- `ST-001/OT-001`: persistence and mutation failure logs are emitted without sensitive payload fields.
- `UX-001`: datasource list loading, empty/read-only, delete, and event states are covered in browser component tests.

## Test Categories Not Applicable

- `Performance`: Not applicable — catalog sizes are small and no expensive runtime path was introduced.

## Validation Run

```text
npm run test:unit -- --run src/composition/use-cases-integration.spec.ts src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts src/adapters/client/local-storage/local-storage-question-repository.spec.ts — passed
npm run test:components -- --run src/features/datasource/ui/datasource-list/datasource-list.spec.ts — passed
node --import tsx/esm --loader ./tests/helpers/yaml-loader.mjs node_modules/@cucumber/cucumber/bin/cucumber.js tests/e2e/features/datasource-collection.feature tests/e2e/features/datasource-linking.feature --import 'tests/e2e/steps/**/*.ts' --format progress --force-exit — passed
npm run typecheck — passed
npm run lint — passed
npm run build — passed (Vite reported existing large chunk warnings)
```

## Accessibility Notes

- Browser component coverage exercised the Datasource list loading, read-only, create-dialog, select, and delete flows. No new custom keyboard interaction was introduced.

## Observability Changes

- Added mutation success/failure logs for Datasource, Question, and Dashboard create/update/delete use cases.
- Retained redacted localStorage repository failure logs for parse/persist failures and added tests proving datasource URLs, SQL text, and dashboard JSON payloads are omitted.

## ADR Updates

- Not applicable — this implementation follows ADR `docs/adrs/001-define-clean-architecture-boundaries.md` without changing the architectural decision.

## Unresolved Assumptions or Follow-Up

- Full `npm run test:e2e` still has three dashboard workspace failures unrelated to catalog persistence: those scenarios fail while dynamically importing `src/infra/db/db.ts`. The datasource collection and datasource linking E2E features pass.
