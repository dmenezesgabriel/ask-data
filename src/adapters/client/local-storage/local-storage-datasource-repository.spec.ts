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

const now = new Date().toISOString();

function makeUserDatasource(id = 'test-ds-1'): Datasource {
  return {
    id,
    slug: `slug-${id}`,
    name: 'Test Datasource',
    type: 'csv',
    url: 'https://example.com/data.csv',
    source: 'user',
    createdAt: now,
    updatedAt: now,
  };
}

// IT-001: LocalStorage adapter round-trips a datasource
describe('LocalStorageDatasourceRepository', () => {
  let lsMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    lsMock = createLocalStorageMock();
  });

  it('IT-001: save() then list() returns the datasource and it appears in localStorage', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository();
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    const list = await repo.list();

    expect(list.some((d) => d.id === datasource.id)).toBe(true);

    const raw = lsMock.store.get('persisted_datasources_v1');
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!) as Datasource[];
    expect(stored.some((d) => d.id === datasource.id)).toBe(true);
  });

  it('get(id) returns the datasource after save()', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository();
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    const found = await repo.get(datasource.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(datasource.id);
  });

  it('delete(id) removes a datasource', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository();
    const datasource = makeUserDatasource();

    await repo.save(datasource);
    await repo.delete(datasource.id);
    const list = await repo.list();

    expect(list.some((d) => d.id === datasource.id)).toBe(false);
  });

  it('list() returns only user-persisted datasources (no YAML seeding in adapter)', async () => {
    const { LocalStorageDatasourceRepository } = await importFreshRepository(lsMock.localStorage);
    const repo = new LocalStorageDatasourceRepository();
    const list = await repo.list();

    // Adapter manages only user-created datasources; YAML seeds are handled upstream.
    expect(list).toEqual([]);
  });
});
