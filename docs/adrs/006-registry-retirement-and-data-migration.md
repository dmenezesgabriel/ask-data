# ADR 001: Registry Retirement and localStorage Data Migration Strategy

## Status

Accepted — Option 2 (new `v2` key with one-time migration on first load)

## Date

2026-05-19

## Related Tasks

- `tasks/issues/014-activate-composition-container.md` (Task 014)

## Context

- The codebase has two parallel layers writing to localStorage: the legacy **Registries** (`datasource-registry.ts`, `question-registry.ts`) and the new **Adapter** classes (`LocalStorageDatasourceRepository`, `LocalStorageQuestionRepository`).
- The registry and the adapter both declare `const STORAGE_KEY = 'persisted_datasources_v1'`. When the AppShell is wired to the composition container, both layers become simultaneously active against the same key.
- The registry's `persistDatasources()` filters to `source === 'user'` before writing; the adapter's `persist()` writes all records unconditionally. If both run against the same key, whichever runs last wins, corrupting the source classification.
- Existing users may have data in the `persisted_datasources_v1` and `persisted_questions_v1` keys. Any activation of the composition container that leaves those keys unread means existing user Datasources and Questions silently disappear.

## Decision

**Option 2 — New key (`v2`) with a one-time migration on first load.**

`LocalStorageDatasourceRepository` and `LocalStorageQuestionRepository` write to and read from
`persisted_datasources_v2` and `persisted_questions_v2` respectively. On first instantiation, each
repository checks whether the v2 key exists. If it does not but a v1 key does, it reads the v1
records, writes them to v2, and removes the v1 key. Failed parses are silently discarded (empty
list is written to v2; v1 is still removed to prevent repeated failed-migration attempts).

The dashboard adapter is excluded from this migration: the `Dashboard` entity shape is
structurally incompatible with the legacy `DashboardConfig` shape stored in
`persisted_dashboards_v1`, so a lossless migration is deferred to a future task.

## Options Considered

```mermaid
flowchart TD
    subgraph opt1["Option 1 — New key, drop legacy data"]
        A1[Adapter writes to v2 key] --> B1[Legacy v1 data ignored]
    end
    subgraph opt2["Option 2 — New key + one-time migration (recommended)"]
        A2[On first load: read v1] --> B2[Write records to v2]
        B2 --> C2[Clear v1 key]
        C2 --> D2[Adapter uses v2 going forward]
    end
    subgraph opt3["Option 3 — Keep v1, retire conflicting registry writes"]
        A3[Adapter keeps v1 key] --> B3[Remove persist() from registry]
        B3 --> C3[Registry becomes read-only seed loader]
    end
```

1. **New key (`v2`), silently drop legacy data** — adapter reads/writes only `persisted_datasources_v2`; existing data in `v1` is abandoned. Simple to implement. Causes silent data loss for any user who saved Datasources before the migration.

2. **New key (`v2`) with a one-time migration on first load** — on AppShell boot, read `v1`, transform records to the new entity shape, write to `v2`, clear `v1`. Preserves existing user data. Requires a schema mapping from `DatasourceConfig` (registry shape) to `Datasource` entity (adapter shape). `(recommended)`

3. **Keep `v1` key, retire the registry's write path** — adapter continues to use `persisted_datasources_v1`; remove the `persistDatasources()` / `persistQuestions()` calls from the registries, keeping them as read-only seed loaders only. Avoids migration complexity but leaves the registries alive longer and risks residual write conflicts during the transition.

## Consequences

Positive (option 2):

- No user data is lost during the registry retirement.
- After migration, the adapter is the single owner of the localStorage key.
- Registry files can be deleted without a separate data migration task.

Negative (option 2):

- Requires a schema mapping function from `DatasourceConfig` to `Datasource` entity.
- Must handle partial or corrupted `v1` data gracefully.
- One-time migration code must be removed after the transition period.

## Validation

- Unit tests verify the migration function maps every `DatasourceConfig` field to the correct `Datasource` entity field.
- Integration test: seed `v1` data, boot the container, verify `v2` is populated and `v1` is cleared.
- Regression test: verify no data loss when `v1` contains seeded + user records.

## Open Questions

- Which shape differences exist between `DatasourceConfig` (registry) and `Datasource` (entity)? A field-by-field comparison is required before implementation begins.
- Should a failed migration (e.g., corrupt `v1` JSON) silently discard the bad records or surface an error to the user?
- Should the migration also handle the `persisted_questions_v1` → `persisted_questions_v2` key rename in the same boot pass?
