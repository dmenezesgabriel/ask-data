# Task: Fix knip config for browser-context dynamic import

## Priority

P2 — Low-risk config fix; knip reports a false-positive unresolved import that is actually a valid browser URL used inside `page.evaluate()`.

## Dependencies

- No task dependency; can start independently.
- No ADR dependency; this task adjusts a static analysis tool configuration.

## Context

Knip reports one unresolved import:

```
/src/infra/db/db.ts — referenced in tests/e2e/steps/steps.ts:107
```

The reference is a dynamic `import()` inside a Playwright `page.evaluate()` call:

```ts
await this.page.evaluate(async () => {
  const mod = await import('/src/infra/db/db.ts');
  await mod.duckDBManager.initialize();
});
```

The string `/src/infra/db/db.ts` is a Vite dev-server URL, not a Node.js module path. It is resolved at runtime by the browser (via Vite's dev server), not by the Node.js module system. Knip cannot resolve it because it starts with `/` and has no `paths` alias mapping.

The current `knip.json` has `"ignoreUnresolved": ["tests/.*/steps/.*"]`. That pattern is matched against file paths, but `ignoreUnresolved` in knip v6 matches against the **import specifier** (the string `/src/infra/db/db.ts`), not the source file path. Adding the specifier pattern `/src/**` to `ignoreUnresolved` suppresses this false positive.

## Use Cases

- **Feature**: Static analysis hygiene
- **Scenario**: Developer runs knip after cleanup
- **Given** the knip config ignores browser-URL specifiers
- **When** the developer runs `npm run knip`
- **Then** knip reports no unresolved imports for browser-context `page.evaluate()` dynamic imports

## Definition of Ready

- Confirmed: the import at `tests/e2e/steps/steps.ts:107` is a `page.evaluate()` browser-context dynamic import using a Vite dev-server path, not a Node.js module.
- Confirmed: `src/infra/db/db.ts` exists and is reachable at that path by the Vite dev server.

## Functional Requirements

- `FR-001`: `knip.json` suppresses the unresolved import false positive for `/src/infra/db/db.ts`.
- `FR-002`: The `ignoreUnresolved` pattern covers all `/src/**` specifiers to handle any future browser-URL imports in `page.evaluate()` calls.

## Non-Functional Requirements

- `NFR-001`: The change must not suppress real unresolved imports in non-browser-context files.

## Observability Requirements

- `OBS-001`: Not applicable — static analysis tool configuration has no runtime observability impact.

## Acceptance Criteria

- `AC-001`: **Given** the updated `knip.json`, **When** `npm run knip` is run, **Then** no unresolved import for `/src/infra/db/db.ts` is reported.
- `AC-002`: **Given** the updated `knip.json`, **When** a real missing import is added to a non-evaluate source file, **Then** knip still reports it as unresolved.

## Required Tests

### Unit Tests

- `UT-001`: Not applicable — static analysis config change with no production logic.

### Integration Tests

- `IT-001`: Not applicable — no boundary behavior changes.

### Smoke Tests

- `SMK-001`: Not applicable — no deploy artifact changes.

### End-to-End Tests

- `E2E-001`: Not applicable — no user-facing behavior changes.

### Regression Tests

- `REG-001`: Not applicable — no known previous defect.

### Performance Tests

- `PT-001`: Not applicable — static analysis tool config change.

### Security Tests

- `ST-001`: Not applicable — no auth, input, or trust boundary changes.

### Usability Tests

- `UX-001`: Not applicable — no user-facing changes.

### Observability Tests

- `OT-001`: Not applicable — no operational behavior changes.

## Definition of Done

- `knip.json` `ignoreUnresolved` includes a pattern that suppresses `/src/**` specifiers.
- `npm run knip` no longer reports the unresolved import for `/src/infra/db/db.ts`.
- Real unresolved imports in non-evaluate files are still caught by knip.
