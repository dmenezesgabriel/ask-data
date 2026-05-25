---
id: "004"
issue: "tasks/issues/004-inject-query-and-ask-ports.md"
created: 2026-05-24
updated: 2026-05-24
---

# Implementation Summary: Inject Query and Ask Data Ports

## Related Task

- `tasks/issues/004-inject-query-and-ask-ports.md`

## Files Changed

- `src/core/application/ports/ask-engine.ts` — added explicit Ask Data engine config and factory port types.
- `src/composition/client-only-container.ts` — exposes DuckDB-WASM query, datasource manager, and Ask Data factory ports.
- `src/composition/client-server-container.ts` — exposes HTTP query, datasource manager, and Ask Data factory ports through the same container shape.
- `src/app/shell/app-shell.ts` — passes query and Ask Data ports into datasource, question, and dashboard editors.
- `src/features/datasource/ui/**` — replaces global DB service usage with injected query ports in datasource preview paths and stories.
- `src/features/question/ui/**` — replaces global DB service usage and direct Ask Data construction with injected query, datasource manager, and Ask Data factory ports.
- `src/features/dashboard/ui/**` — replaces dashboard workspace/query paths and widget editor paths with injected ports.
- `src/features/ask/orchestration/**` — creates dashboard orchestrators from injected datasource manager and Ask Data factory ports.
- `src/features/ask/model/ask-data.ts` and `src/infra/db/db.ts` — removes raw question and SQL details from default telemetry.
- `src/shared/observability/logger.ts` — redacts SQL and datasource URLs from serialized error logs.
- `tests/e2e/features/ask-data.feature` and `tests/e2e/steps/steps.ts` — adds the Ask Data natural-language user journey.
- `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts` — verifies Ask Data initializes in client-only mode without global DB service errors.
- `src/shared/architecture/import-boundaries.spec.ts` — verifies DB service imports stay out of source files outside composition/adapters.
- `src/**/*.{spec,stories}.ts` — updates tests and stories to use fake ports instead of initializing DuckDB-WASM.

## Behavior Implemented

- Datasource previews execute through an injected `QueryPort` and can render in tests without `setDbService`.
- Question previews create datasource views through `DataSourceManager`, execute SQL through `QueryPort`, and execute natural-language previews through an injected Ask Data engine factory.
- Dashboard widgets execute SQL through `QueryPort`; Ask Data widgets and the dashboard Ask Data tab use injected Ask Data ports.
- Client-only composition keeps DuckDB-WASM as the underlying adapter, while client-server composition delegates the same query port through the HTTP adapter.
- Query and Ask Data failure logs include operation and adapter name without raw SQL, datasource URLs, or user question text.

## Design Notes

- Port wiring is explicit at the app/container boundary; feature UI receives collaborators as properties and no longer imports the DB service locator.
- `AskDataEngine` construction remains in composition, preserving Clean Architecture dependency direction while keeping client-only behavior.
- No broad UI rewrite was introduced; existing Lit component structure and catalog service conventions were preserved.

## Tests Added or Updated

- `src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts` — verifies datasource preview with a fake query port.
- `src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts` — verifies SQL preview with fake query/datasource ports and natural-language preview with a fake Ask Data engine.
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts` — verifies dashboard widget SQL delegates through injected query and datasource ports.
- `src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts` — covers `SMK-001` for client-only Ask Data UI initialization.
- `src/composition/composition.spec.ts` — verifies client-only DuckDB-WASM query port composition and client-server HTTP query port delegation.
- `src/shared/observability/logger.spec.ts` — covers `ST-001` failed query log redaction.
- `src/features/ask/model/ask-data.spec.ts` — covers `OT-001` Ask Data success/failure telemetry without user question text.
- `tests/e2e/features/ask-data.feature` — covers `E2E-001` natural-language Ask Data result UI flow.
- `src/shared/architecture/import-boundaries.spec.ts` — verifies `shared/services/db-service` is not imported outside composition/adapters.

## Test Categories Not Applicable

- Performance: Not applicable — this task changes dependency wiring and telemetry metadata, not query algorithms.
- ADR update: Not applicable — ADR 003 already records deployment mode as a composition detail; the implementation follows it without changing the decision.

## Validation Run

```text
npm run typecheck — passed
npm run test:unit -- --run src/shared/observability/logger.spec.ts src/features/ask/model/ask-data.spec.ts src/composition/composition.spec.ts — passed, 3 files / 16 tests
npm run test:components -- --run src/features/datasource/ui/datasource-editor-panel/datasource-editor-panel.spec.ts src/features/question/ui/question-editor-panel/question-editor-panel.spec.ts src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.spec.ts src/features/dashboard/ui/dashboard-editor/dashboard-editor.smoke.spec.ts — passed, 4 files / 40 tests
npm run test:e2e -- tests/e2e/features/ask-data.feature — Ask Data scenario passed, but the command runs all E2E features and existing dashboard workspace scenarios still failed while dynamically importing /src/infra/db/db.ts for DuckDB pre-warm.
```

## Accessibility Notes

- Existing recoverable error announcements remain rendered with `role="alert"` for Datasource, Question, and Dashboard contexts and are covered by component tests.
- Ask Data smoke coverage verifies the client-only UI initializes without surfacing a missing DB service error.

## Observability Changes

- Datasource, question, and dashboard query failures log operation type and query adapter name.
- Ask Data spans still record elapsed time through logger spans and metrics, without logging user question text by default.
- DuckDB query failure logs no longer include SQL text by default.
- DuckDB query failure logs include `operation: query` and `adapter: duckdb-wasm` metadata.

## ADR Updates

- Not applicable — no ADR-backed decision changed.

## Unresolved Assumptions or Follow-Up

- `src/shared/services/db-service.ts` remains in the repository but has no source imports outside its own module; removal can be handled in a cleanup task if desired.
- Vite build reports existing bundle size warnings for DuckDB/Transformers assets.
- The `npm run test:e2e -- tests/e2e/features/ask-data.feature` script still executes all configured E2E feature files because the package script hardcodes `tests/e2e/features/**/*.feature`; the new Ask Data scenario passed, while unrelated dashboard workspace scenarios failed on the existing DuckDB pre-warm dynamic import path.
