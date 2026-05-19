import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

// UT-001: createClientOnlyContainer() returns a container with ListDatasources
describe('createClientOnlyContainer', () => {
  it('UT-001: returns a container with LocalStorage-backed use cases', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    vi.resetModules();
    const { createClientOnlyContainer } = await import('./client-only-container');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');
    const container = createClientOnlyContainer();

    // Verify use case types
    expect(container.listDatasources).toBeInstanceOf(ListDatasources);
    expect(container.createDatasource).toBeDefined();
    expect(container.deleteQuestion).toBeDefined();

    // Verify LocalStorage backing: after create, localStorage has data
    await container.createDatasource.execute({
      name: 'Probe',
      type: 'csv',
      url: 'https://x.com/f.csv',
    });
    expect(store.get('persisted_datasources_v1')).toBeTruthy();
  });
});

// UT-002: createClientServerContainer() returns a container with HttpDatasourceRepository
describe('createClientServerContainer', () => {
  it('UT-002: returns a container with HTTP-backed use cases', async () => {
    vi.resetModules();
    // Mock fetch to verify HttpDatasourceRepository is used
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { createClientServerContainer } = await import('./client-server-container');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');
    const container = createClientServerContainer();

    expect(container.listDatasources).toBeInstanceOf(ListDatasources);

    // Verify HTTP backing: list() calls fetch
    await container.listDatasources.execute();
    expect(fetchMock).toHaveBeenCalledWith('/api/datasources');
  });
});

// IT-001: Client-only container round-trips a datasource
describe('IT-001: client-only container datasource round-trip', () => {
  it('created datasource appears in list', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    vi.resetModules();

    const { createClientOnlyContainer } = await import('./client-only-container');
    const container = createClientOnlyContainer();

    await container.createDatasource.execute({
      name: 'Test DS',
      type: 'csv',
      url: 'https://example.com/test.csv',
    });

    const list = await container.listDatasources.execute();
    expect(list.some((d) => d.name === 'Test DS')).toBe(true);
  });
});
