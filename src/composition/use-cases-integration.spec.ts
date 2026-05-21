import { afterEach, describe, expect, it, vi } from 'vitest';

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createLocalStorageMock(): { store: Map<string, string>; localStorage: LocalStorageMock } {
  const store = new Map<string, string>();
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

// IT-001: Datasource survives a localStorage round-trip via use cases
describe('IT-001: CreateDatasource + LocalStorageDatasourceRepository', () => {
  it('created datasource appears in list and localStorage under v2 key', async () => {
    const { store, localStorage: lsMock } = createLocalStorageMock();
    vi.resetModules();
    vi.stubGlobal('localStorage', lsMock);

    const { LocalStorageDatasourceRepository } =
      await import('@/adapters/client/local-storage/local-storage-datasource-repository');
    const { CreateDatasource } =
      await import('@/core/application/use-cases/datasources/create-datasource');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');

    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const repo = new LocalStorageDatasourceRepository(fakeClock);
    const fakeId = { create: () => 'it-001-id' };

    const createUc = new CreateDatasource(repo, fakeId, fakeClock);
    await createUc.execute({ name: 'Sales', type: 'csv', url: 'https://example.com/s.csv' });

    const listUc = new ListDatasources(repo);
    const list = await listUc.execute();
    expect(list.some((d) => d.id === 'it-001-id')).toBe(true);

    const raw = store.get('persisted_datasources_v2');
    expect(raw).toBeTruthy();
  });

  // IT-002: Legacy v1 data is visible after migration
  it('IT-002: datasources in v1 are readable through use cases after migration', async () => {
    const legacyDatasource = {
      id: 'legacy-ds-id',
      slug: 'legacy-ds',
      name: 'Legacy Source',
      type: 'csv' as const,
      url: 'https://example.com/old.csv',
      source: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const { store, localStorage: lsMock } = createLocalStorageMock();
    store.set('persisted_datasources_v1', JSON.stringify([legacyDatasource]));
    vi.resetModules();
    vi.stubGlobal('localStorage', lsMock);

    const { LocalStorageDatasourceRepository } =
      await import('@/adapters/client/local-storage/local-storage-datasource-repository');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');

    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const repo = new LocalStorageDatasourceRepository(fakeClock);
    const listUc = new ListDatasources(repo);
    const list = await listUc.execute();

    expect(list.some((d) => d.id === 'legacy-ds-id')).toBe(true);
    expect(store.has('persisted_datasources_v2')).toBe(true);
    expect(store.has('persisted_datasources_v1')).toBe(false);
  });
});
