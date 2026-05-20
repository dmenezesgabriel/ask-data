---
id: '006'
created: 2026-05-19
updated: 2026-05-19
status: active
---

# Task: TypeScript strictness, dead code removal, and env declaration

## Priority

P2 — Independent cleanup. Should be started after Task 005 (explicit types in ask model), because enabling `noImplicitAny` in this task will fail to compile until the untyped parameters in ask model are addressed.

## Dependencies

- Depends on Task 005: the explicit parameter types in `SqlPlanner`, `CatalogBuilder`, and `QuestionParser` must be in place before `noImplicitAny: true` is enabled here.
- No ADR dependency.

## Assignability

**AFK** — all changes are fully specified; no architectural decisions remain open.

## Context

Five independent housekeeping issues grouped into one task because they are all purely mechanical and share no runtime risk:

**1. Duplicate `QueryPort` interface** (`src/infra/query/query-port.ts` and `src/core/application/ports/query-port.ts`): both files declare the identical three-line interface. `CatalogBuilder` imports from the core ports path; `DuckDBManager` implements the infra path. Structural typing makes them compatible, but having two canonical locations causes confusion.

**2. Empty `Dashboard` subclass** (`src/app/shell/app-shell.ts:155`): `export class Dashboard extends AppShell {}` has no added behaviour. It exists only so `customElements.define('app-dashboard', Dashboard)` can register a different tag name. An empty subclass is a misleading pattern; a direct call to `customElements.define('app-dashboard', AppShell)` is clearer.

**3. `slugToTitle` defined inside `render()`** (`src/app/shell/app-shell.ts:110-114`): the function is recreated on every render. It has no dependency on `this`. It belongs at module scope.

**4. `tsconfig.json` strictness gaps**: `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false` are explicitly disabled. `ignoreDeprecations: "6.0"` silences TypeScript 6 deprecation warnings. With Task 005 complete, `noImplicitAny` can be enabled. `noUnusedLocals` and `noUnusedParameters` can also be enabled after verifying no false positives exist.

**5. `VITE_RUNTIME_MODE` not declared in `env.d.ts`** (`src/env.d.ts`): the environment variable is read in `app-container.ts` but not typed in `env.d.ts`. Typos in the value are invisible at compile time; the app silently defaults to `client-only` for any unrecognised string.

## Use Cases

- **Feature**: Developer configures client-server mode
- **Scenario**: Developer sets `VITE_RUNTIME_MODE` to a typo (`'client-sever'`)
- **Given** `VITE_RUNTIME_MODE` is declared in `env.d.ts` as a union type
- **When** the developer reads `import.meta.env.VITE_RUNTIME_MODE`
- **Then** TypeScript IDE tooling highlights the unexpected value

## Definition of Ready

- Task 005 is merged (explicit types in ask model layer).
- No files in the project use the `Dashboard` subclass by name (can be verified with `grep -r 'Dashboard' src/ --include='*.ts' | grep -v 'app-shell'`).

## Functional Requirements

- `FR-001`: `src/infra/query/query-port.ts` is deleted; any file importing from it is updated to import from `@/core/application/ports`.
- `FR-002`: `export class Dashboard extends AppShell {}` is removed from `app-shell.ts`; replaced with `customElements.define('app-dashboard', AppShell)`.
- `FR-003`: `slugToTitle` is moved to module scope in `app-shell.ts`.
- `FR-004`: `tsconfig.json` sets `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. `ignoreDeprecations` is removed.
- `FR-005`: `src/env.d.ts` declares `interface ImportMetaEnv` with `VITE_RUNTIME_MODE?: 'client-only' | 'client-server'`. A runtime assertion in `app-container.ts` warns when the value is non-empty and unrecognised.

## Non-Functional Requirements

- `NFR-001`: `npm run typecheck` produces zero errors after all five changes.
- `NFR-002`: `npm run build` produces zero errors.
- `NFR-003`: No runtime behaviour changes — all fixes are structural or type-level.

## Observability Requirements

- `OBS-001`: No new observability requirements.

## Acceptance Criteria

- `AC-001`: **Given** `grep -r 'src/infra/query/query-port' src/` is run, **Then** no import statements are found.
- `AC-002`: **Given** `grep -r 'class Dashboard extends AppShell' src/` is run, **Then** no matches are found.
- `AC-003`: **Given** `tsconfig.json` has `"noImplicitAny": true`, **When** `npm run typecheck` is run, **Then** it exits with code 0.
- `AC-004`: **Given** `import.meta.env.VITE_RUNTIME_MODE` is accessed in TypeScript, **Then** the IDE provides autocomplete with `'client-only' | 'client-server' | undefined`.
- `AC-005`: **Given** `slugToTitle` is called from `app-shell.ts render()`, **Then** the function is defined at module scope, not inside `render()`.

## Required Tests

### Unit Tests

- `UT-001`: Import `QueryPort` from `@/core/application/ports` in a test; assert `DuckDBManager` satisfies the type. Covers `FR-001`, `AC-001`.

### Integration Tests

Not applicable — all changes are structural/type-level with no cross-boundary interactions.

### Smoke Tests

Not applicable — no startup or build-path changes beyond `typecheck` passing.

### End-to-End Tests

Not applicable — no user-visible behaviour changes.

### Regression Tests

Not applicable — no known previous defects in these areas.

### Performance Tests

Not applicable — type changes and dead code removal have no runtime performance impact.

### Security Tests

Not applicable — no authentication, authorization, or input handling changes.

### Usability Tests

Not applicable — no user-visible changes.

### Observability Tests

Not applicable — no new telemetry.

## Definition of Done

- `src/infra/query/query-port.ts` is deleted.
- `class Dashboard extends AppShell {}` is removed; `customElements.define('app-dashboard', AppShell)` is added.
- `slugToTitle` is at module scope.
- `tsconfig.json` has `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, and no `ignoreDeprecations`.
- `env.d.ts` declares `ImportMetaEnv` with `VITE_RUNTIME_MODE`.
- `npm run typecheck` and `npm run build` exit with code 0.
- `npm run knip` exits with no unused exports reported for the deleted interface.
- Existing unit, integration, and component tests continue to pass.
