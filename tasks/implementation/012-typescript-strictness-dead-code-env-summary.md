# Implementation Summary: Task 012 — TypeScript strictness, dead code removal, and env declaration

## Files Changed

### Deleted

- `src/infra/query/query-port.ts` — duplicate `QueryPort` interface removed; all imports updated to `@/core/application/ports`

### Modified

- `tsconfig.json` — enabled `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`; removed `ignoreDeprecations: "6.0"`; migrated `baseUrl` + `paths` to `paths`-only with `./src/*` prefix (TypeScript 6.x compatibility)
- `src/env.d.ts` — added `ImportMetaEnv` and `ImportMeta` interfaces declaring `VITE_RUNTIME_MODE?: 'client-only' | 'client-server'`
- `src/composition/app-container.ts` — added runtime `console.warn` for unrecognised `VITE_RUNTIME_MODE`; renamed `_container` → `export const container` to satisfy `noUnusedLocals`
- `src/app/shell/app-shell.ts` — moved `slugToTitle` to module scope; removed empty `Dashboard extends AppShell` subclass; replaced `customElements.define('app-dashboard', Dashboard)` with `customElements.define('app-dashboard', AppShell)`
- `src/infra/db/db.spec.ts` — updated `QueryPort` import from infra path to `@/core/application/ports`

### Typed (noImplicitAny fixes)

- `src/features/ask/model/term-matcher.ts` — `terms`, `alternation`, `pattern`, `patternFromTerm`, `has`, `first`
- `src/features/ask/model/field-search.ts` — all strategy methods (`matchPhrase`, `findInText`, `directMatches`, `fieldTerms`, `activeTerms`, `resolvePhrase`, `search`)
- `src/features/ask/model/semantic-field-matcher.ts` — `matchField`, `initialize`, `load`, `fieldText`, `embedOne`
- `src/features/ask/model/intent-cue-detector.ts` — all eight methods
- `src/features/ask/model/month-catalog.ts` — `find`, `has`
- `src/features/ask/model/date-question-text.ts` — `removeText`, `removeRange`
- `src/features/ask/model/date-range-parser.ts` — added `ChronoResult` and `RelativePeriodSpec` types; typed all `parse`, `rangeFor`, `findResult`, `hasDateCue`, `isAmbiguousNumericDate`, `toDateRange` methods
- `src/features/ask/model/value-filter-resolver.ts` — `findMatches`, `resolveAmbiguousField`, `toFilters`
- `src/features/ask/model/question-parser.ts` — typed `groups` Map; `detectListField`, `detectSuperlative`
- `src/features/ask/model/ask-data.ts` — added imports for `AskIntent`, `ClarificationPending`, `DateRange`, `DiagnosticDateParse`, `DiagnosticFilterSelectivity`, `DiagnosticJoinFanout`, `IntentFilter`, `PlannedSql`, `Labelable`; typed `terms`, `termAlternation`, `hasTerm`, `localizedMapValue` (generic), `localizedTerms`, `displayLabel`, `ask`, `parseQuestion`, all `evaluate*`, `fieldClarification`, `timeSqlExpression`, `planSql`, `buildJoinPlan`, `findRelationshipPath`, all `describe*` methods
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts` — typed `r` callbacks as `Record<string, CellValue>`; fixed `widget.query ?? ''` call
- `src/features/question/ui/question-editor-panel/question-editor-panel.ts` — added `CellValue` import; typed `r` callbacks

### Dead code removed (noUnusedLocals fixes)

- `src/features/ask/model/semantic-modeling.ts` — removed unused private `isNumericType` method
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts` — removed dead `_syncSheetData` private method
- `src/features/ask/model/narrative-generator.ts` — renamed unused `summary` param to `_summary`
- `src/features/ask/model/value-filter-resolver.spec.ts` — removed unused `_countryField`, `_displayLabel`, `_localizedTerms` test-scope declarations
- `src/features/ask/model/date-range-parser.spec.ts` — removed invalid `null as unknown as DateProfile` cast; test now passes `null` directly
- `src/features/ask/model/value-filter-resolver.spec.ts` — added `originalQuestion: null` to `ClarificationPending` objects in tests

## Behavior Implemented

- All five FRs from the task spec are satisfied with no runtime behavior changes.
- `VITE_RUNTIME_MODE` is typed and validated at runtime with a console warning for unrecognised values.
- `slugToTitle` is now a pure module-level function, not recreated on every render.
- `app-dashboard` custom element is registered directly on `AppShell` without the misleading empty subclass.
- The `baseUrl` deprecation in TypeScript 6.x is resolved by removing `baseUrl` and using `./src/*` relative paths in `paths`.

## Tests Added or Updated

- `src/infra/db/db.spec.ts` — import path updated to `@/core/application/ports` (UT-001)
- `src/features/ask/model/date-range-parser.spec.ts` — fixed null cast
- `src/features/ask/model/value-filter-resolver.spec.ts` — removed unused vars; added `originalQuestion: null` to satisfy `ClarificationPending`

## Validations Run

- `npm run typecheck` — exits 0 (zero errors)
- `npm run build` — exits 0 (warnings only, no errors)
- `npm run test:unit` — 691 tests, 48 files, all pass
- `npm run knip` — no `QueryPort` infra export reported; `container` export flagged (pre-existing: was `_container` before, Task 014 will consume it)

## Accessibility Checks

Not applicable — no UI changes beyond removing dead code.

## ADRs Updated

None — all changes are within existing module boundaries with no architectural decisions.

## Intentional Non-applicable Test Categories

- Integration, smoke, e2e, regression, performance, security, usability: no runtime behaviour changes.

## Unresolved Assumptions

- `export const container` in `app-container.ts` is flagged by knip as an unused export. This is expected: Task 014 will import and consume it when activating the composition container in `AppShell`.
- `src/adapters/http/http-error.ts` and `ClientServerContainer` type are flagged by knip but were pre-existing before this task.
