# 011 Fix husky knip failures

## What changed

- Removed unused barrel files:
  - `src/adapters/client/local-storage/index.ts`
  - `src/adapters/http/index.ts`
  - `src/adapters/memory/index.ts`
- Removed unused shim file:
  - `src/infra/infra-service.ts`

## Behavior implemented

- `npm run knip` no longer reports unused files for these paths.
- Husky `pre-push` can proceed past the knip step.

## Tests and validations run

- `npm run knip`

## Accessibility checks

- Not applicable — no UI behavior changed.

## ADR updates

- None.

## Intentional non-applicable test categories

- No unit, component, integration, or e2e tests were changed because this is dead-file cleanup only.

## Unresolved assumptions or follow-up work

- None.
