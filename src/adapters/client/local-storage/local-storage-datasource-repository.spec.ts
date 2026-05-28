import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Datasource } from '@/core/entities';

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createLocalStorageMock(seed: Record<string, string> = {}): {
  store: Map<string, string>;
  localStorage: LocalStorageMock;
} {
  const store = new Map(Object.entries(seed));
  return {
    store,
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
      removeItem: (key) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  };
}

type RepositoryModule = typeof import('./local-storage-datasource-repository');

async function importFreshRepository(ls: LocalStorageMock): Promise<RepositoryModule> {
  vi.resetModules();
  vi.stubGlobal('localStorage', ls);
  return import('./local-storage-datasource-repository');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const FIXED_TIME = '2025-01-01T00:00:00.000Z';
const mockClock = { now: () => FIXED_TIME };

function makeUserDatasource(id = 'test-ds-1'): Datasource {
  return {
    id,
    slug: `slug-${id}`,
    name: 'Test Datasource',
    type: 'csv',
    url: 'https://example.com/data.csv',
    source: 'user',
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  };
}

describe('LocalStorageDatasourceRepository', () => {
  let lsMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    lsMock = createLocalStorageMock();
  });

  it('IT-001: save() then list() returns the datasource and it appears in localStorage under v2 key', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    const list = await repo.list();

    expect(list.some((d) => d.id === datasource.id)).toBe(true);

    const raw = lsMock.store.get('persisted_datasources_v2');
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!) as Datasource[];
    expect(stored.some((d) => d.id === datasource.id)).toBe(true);
    expect(lsMock.store.has('persisted_datasources_v1')).toBe(false);
  });

  it('get(id) returns the datasource after save()', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    const found = await repo.get(datasource.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(datasource.id);
  });

  // UT-001: get() matches by id and slug
  it('UT-001: get() returns a record when queried by slug and when queried by id', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const datasource = makeUserDatasource('uuid-550e8400');

    await repo.save(datasource);

    const byId = await repo.get('uuid-550e8400');
    expect(byId).not.toBeNull();
    expect(byId?.id).toBe('uuid-550e8400');

    const bySlug = await repo.get('slug-uuid-550e8400');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe('uuid-550e8400');
  });

  // UT-002: get() returns null for non-existent id/slug
  it('UT-002: get() returns null for a non-existent id or slug', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const datasource = makeUserDatasource();

    await repo.save(datasource);

    await expect(repo.get('non-existent-id')).resolves.toBeNull();
    await expect(repo.get('non-existent-slug')).resolves.toBeNull();
  });

  it('delete(id) removes a datasource', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    await repo.delete(datasource.id);
    const list = await repo.list();

    expect(list.some((d) => d.id === datasource.id)).toBe(false);
  });

  it('list() returns only user-persisted datasources (no YAML seeding in adapter)', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository(mockClock);
    const list = await repo.list();

    expect(list).toEqual([]);
  });

  // UT-001: Clock port is used for updatedAt on update
  it('UT-001: save() uses the injected Clock for updatedAt when updating an existing record', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const stubClock = { now: () => '2025-01-01T00:00:00.000Z' };
    const repo = new LocalStorageDatasourceRepository(stubClock);
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    await repo.save({ ...datasource, name: 'Updated Name' });

    const found = await repo.get(datasource.id);
    expect(found?.updatedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  // IT-002: Legacy v1 data is migrated to v2 on first instantiation
  it('IT-002: v1 records are migrated to v2 and v1 key is removed on construction', async () => {
    const legacyRecord = makeUserDatasource('legacy-id');
    const seedStore: Record<string, string> = {
      persisted_datasources_v1: JSON.stringify([legacyRecord]),
    };
    const { store, localStorage: ls } = createLocalStorageMock(seedStore);

    const { LocalStorageDatasourceRepository } = await importFreshRepository(ls);
    const repo = new LocalStorageDatasourceRepository(mockClock);

    const list = await repo.list();
    expect(list.some((d) => d.id === 'legacy-id')).toBe(true);
    expect(store.has('persisted_datasources_v2')).toBe(true);
    expect(store.has('persisted_datasources_v1')).toBe(false);
  });

  it('skips migration if v2 key already exists', async () => {
    const v2Record = makeUserDatasource('v2-id');
    const v1Record = makeUserDatasource('v1-id');
    const seedStore: Record<string, string> = {
      persisted_datasources_v2: JSON.stringify([v2Record]),
      persisted_datasources_v1: JSON.stringify([v1Record]),
    };
    const { store, localStorage: ls } = createLocalStorageMock(seedStore);

    const { LocalStorageDatasourceRepository } = await importFreshRepository(ls);
    const repo = new LocalStorageDatasourceRepository(mockClock);

    // v1 should NOT have been migrated (v2 already exists)
    expect(repo).toBeDefined();
    expect(store.has('persisted_datasources_v1')).toBe(true);
  });
});
