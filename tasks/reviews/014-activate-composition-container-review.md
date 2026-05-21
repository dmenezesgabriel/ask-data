---
id: '014'
issue: 'tasks/issues/014-activate-composition-container.md'
created: 2026-05-21
updated: 2026-05-21
resolved: 2026-05-21
---

# Review: Activate the composition container in AppShell and retire direct Registry imports

## Related Task

- `tasks/issues/014-activate-composition-container.md`

## Overall Verdict

**Pass**

No Blocking findings. No Non-blocking findings. All ACs pass. All required tests (UT-001 through UT-003, IT-001, IT-002, E2E-001, REG-001) are present and verified. A registry regression (stale in-memory cache diverging from container writes) was identified and fixed as part of this review cycle. FR-003 is fully satisfied: `AppShell` calls `container.getDashboardBySlug.execute(slug)` via a `GetDashboardBySlug` use-case class in the features layer.

## Findings

_None._

## AC Evaluation

| AC     | Result | Notes                                                                                                                                                                                                                                                                                                                  |
| ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Pass   | `persisted_datasources_v2` key asserted in `local-storage-datasource-repository.spec.ts:80–84` (IT-001) and `use-cases-integration.spec.ts:59–60`. UUID `id` from `CryptoIdGenerator`; ISO timestamp from `SystemClock`.                                                                                               |
| AC-002 | Pass   | `use-cases-integration.spec.ts:64–94` (IT-002): seeds `persisted_datasources_v1`, constructs `LocalStorageDatasourceRepository`, runs `ListDatasources.execute()`, asserts the legacy record is readable and `v1` is removed. Registries now also read from v2 so migrated data is visible via the registry read path. |
| AC-003 | Pass   | `as unknown as AppContainer` cast removed. `AppContainer` defined as `Omit<_Full, _WriteKeys> & Partial<Pick<_Full, _WriteKeys>>`. `createClientServerContainer()` satisfies it structurally without a cast. `npm run typecheck` passes.                                                                               |
| AC-004 | Pass   | `local-storage-datasource-repository.spec.ts:120–131` (UT-001) and `local-storage-question-repository.spec.ts` (UT-002): stubbed `Clock` asserts `updatedAt` equals the stub value.                                                                                                                                    |

## Test Coverage Evaluation

| Test Category        | Status         | Notes                                                                                                                                                                                                   |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (UT-001)        | Present        | `src/adapters/client/local-storage/local-storage-datasource-repository.spec.ts:120–131` — Clock stub sets `updatedAt`                                                                                   |
| Unit (UT-002)        | Present        | `src/adapters/client/local-storage/local-storage-question-repository.spec.ts` — Clock stub sets `updatedAt` for questions                                                                               |
| Unit (UT-003)        | Present        | `src/composition/composition.spec.ts:70–113` — both containers satisfy `AppContainer` without casts                                                                                                     |
| Integration (IT-001) | Present        | `src/composition/use-cases-integration.spec.ts:35–61` — datasource round-trip via use cases, v2 key asserted                                                                                            |
| Integration (IT-002) | Present        | `src/composition/use-cases-integration.spec.ts:64–94` — v1 migration via use cases; record readable; v1 cleared                                                                                         |
| Smoke                | Not applicable | Task specifies: no new startup path; AppShell renders the same elements                                                                                                                                 |
| E2E (E2E-001)        | Present        | `tests/e2e/features/datasource-collection.feature` — Scenario: "Created datasource persists across page reload": create via AppShell → reload → verify list shows the datasource                        |
| Regression (REG-001) | Present        | `tests/e2e/features/datasource-collection.feature` — Scenario: "Legacy v1 datasources are preserved after v1-to-v2 migration": injects into v1 → reload triggers migration → asserts datasource visible |
| Performance          | Not applicable | Task specifies: localStorage round-trip performance unchanged                                                                                                                                           |
| Security             | Not applicable | Task specifies: no auth, authorization, input handling, secrets, or trust boundaries touched                                                                                                            |
| Usability            | Not applicable | Task specifies: user-visible behaviour unchanged                                                                                                                                                        |
| Observability        | Not applicable | OBS-001: existing `AppLogger` calls in use cases are sufficient                                                                                                                                         |

## Observability Evaluation

Not applicable — OBS-001 requires no new observability. `app-shell.ts` catch blocks log `console.error('[app-shell] Failed to create datasource/question/dashboard', err)` for runtime errors.

## ADR Compliance

| ADR                                                       | Required Action                                                | Status                                                                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `docs/adrs/006-registry-retirement-and-data-migration.md` | Updated from Proposed to Accepted with chosen migration option | Done — status is `Accepted — Option 2 (new v2 key with one-time migration on first load)`; dashboard exclusion documented |

## Convention Notes

- **`GetDashboardBySlug` use-case class**: `container.getDashboardBySlug` is now a `GetDashboardBySlug` instance exposing `execute(slug): DashboardConfig | undefined`. This wraps the registry lookup in the use-case pattern, satisfying FR-003 in full. The `DashboardConfig` return type (not the core `Dashboard` entity) is intentional: `DashboardEditor.config` requires `DashboardConfig`; the full entity migration is deferred per ADR-006.

- **Registry stateless refactor (additional change)**: Both `datasource-registry.ts` and `question-registry.ts` had their module-level `_userDatasources`/`_userQuestions` in-memory cache removed. All reads now call `loadPersistedDatasources()`/`loadPersistedQuestions()` fresh. This was required to fix a regression: the container adapters write to `v2` while the registries loaded `v1` into memory at module init (before the migration cleared it). After migration, the list components (which read via the registry) would show an empty user list on subsequent page loads. Making the registries stateless and pointing them at `v2` resolves the split and allows the E2E tests to pass correctly.

- E2E inject helpers (`injectUserDatasource`, `injectUserQuestion`) updated from `v1` to `v2` keys. `injectLegacyDatasource` (new) writes to `v1` specifically for REG-001 migration testing.

- Storage key assertions in `steps.ts` updated to `v2`: `'the datasource {string} should exist in the registry'`, `'the datasource {string} should have URL {string}'`, `'the legacy question should have dataSourceSlugs...'`.

## Unresolved Assumptions or Follow-Up

1. **Pre-existing lint errors** (3 files: `ask-data.ts`, `question-editor-panel.ts`, `db.spec.ts`): Present before this task. Not a finding for this review.

2. **`migrateV1toV2()` cleanup**: One-time migration code in `LocalStorageDatasourceRepository` and `LocalStorageQuestionRepository` should be removed after the transition period. Track as follow-up.

3. **Dashboard entity migration**: `LocalStorageDashboardRepository` writes to `persisted_entity_dashboards_v1` (separate from the registry's `persisted_dashboards_v1`). The `dashboard-registry` still uses its own in-memory cache and `persisted_dashboards_v1`. Dashboard read path not migrated in this task per ADR-006 exclusion.
