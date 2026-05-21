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

    // Verify LocalStorage backing: after create, localStorage has data under v2 key
    await container.createDatasource.execute({
      name: 'Probe',
      type: 'csv',
      url: 'https://x.com/f.csv',
    });
    expect(store.get('persisted_datasources_v2')).toBeTruthy();
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

// UT-003: Both containers structurally satisfy AppContainer without casts
describe('UT-003: AppContainer structural compatibility', () => {
  it('createClientOnlyContainer() satisfies AppContainer', async () => {
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

    // All required read-only fields present
    expect(container.getDatasource).toBeDefined();
    expect(container.listDatasources).toBeDefined();
    expect(container.getQuestion).toBeDefined();
    expect(container.listQuestions).toBeDefined();
    expect(container.getDashboard).toBeDefined();
    expect(container.listDashboards).toBeDefined();
    // Write fields present in client-only container
    expect(container.createDatasource).toBeDefined();
    expect(container.createQuestion).toBeDefined();
    expect(container.createDashboard).toBeDefined();
  });

  it('createClientServerContainer() satisfies AppContainer (read-only fields only)', async () => {
    vi.resetModules();

    const { createClientServerContainer } = await import('./client-server-container');
    const container = createClientServerContainer();

    // All required read-only fields present
    expect(container.getDatasource).toBeDefined();
    expect(container.listDatasources).toBeDefined();
    expect(container.getQuestion).toBeDefined();
    expect(container.listQuestions).toBeDefined();
    expect(container.getDashboard).toBeDefined();
    expect(container.listDashboards).toBeDefined();
    // Write fields absent (server container is read-only)
    expect((container as Record<string, unknown>).createDatasource).toBeUndefined();
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
