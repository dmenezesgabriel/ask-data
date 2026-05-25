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

describe('Task 004 query adapter composition', () => {
  it('IT-001: client-only dashboard widget query executes through the DuckDB-WASM-backed query port', async () => {
    const store = new Map<string, string>();
    const duckDbQuery = vi.fn().mockResolvedValue({ rows: [{ label: 'West', value: 12 }] });
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
    vi.doMock('@/infra/db/db', () => ({
      duckDBManager: { query: duckDbQuery, initialize: vi.fn() },
      DuckDBManager: class {},
    }));
    vi.resetModules();

    const { createClientOnlyContainer } = await import('./client-only-container');
    const container = createClientOnlyContainer();
    const widget = {
      id: 'sales-widget',
      type: 'chart',
      title: 'Sales by Region',
      queryType: 'sql',
      query: 'SELECT region AS label, sales AS value FROM sales',
    };
    const result = await container.queryPort.query(widget.query);

    expect(container.queryAdapterName).toBe('duckdb-wasm');
    expect(duckDbQuery).toHaveBeenCalledWith('SELECT region AS label, sales AS value FROM sales');
    expect(result).toEqual({ rows: [{ label: 'West', value: 12 }] });
    expect(container.dataSourceManager).toBeDefined();
    expect(container.createAskEngine).toBeDefined();
  });

  it('IT-002: client-server query port delegates through the HTTP query adapter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ columns: ['total'], rows: [{ total: 42 }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();

    const { createClientServerContainer } = await import('./client-server-container');
    const container = createClientServerContainer();
    const result = await container.queryPort.query('SELECT 42 AS total');

    expect(container.queryAdapterName).toBe('http');
    expect(fetchMock).toHaveBeenCalledWith('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasourceId: 'default', sql: 'SELECT 42 AS total' }),
    });
    expect(result).toEqual({ columns: ['total'], rows: [{ total: 42 }] });
  });
});

describe('Task 007 deployment composition contracts', () => {
  it('IT-001: client-only composition exposes catalog writes and DuckDB query capability', async () => {
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

    const { hasOperationCapability, isSupportedOperations } =
      await import('./application-composition');
    const { createClientOnlyContainer } = await import('./client-only-container');
    const container = createClientOnlyContainer();

    expect(container.deploymentMode).toBe('client-only');
    expect(container.queryAdapterName).toBe('duckdb-wasm');
    expect(hasOperationCapability(container.capabilitySnapshot, 'catalog.datasources.write')).toBe(
      true,
    );
    expect(hasOperationCapability(container.capabilitySnapshot, 'query.execute')).toBe(true);
    expect(isSupportedOperations(container.catalog.datasources.mutations)).toBe(true);
    if (container.catalog.datasources.mutations.supported) {
      expect(container.catalog.datasources.mutations.useCases.create).toBe(
        container.createDatasource,
      );
    }
  });

  it('IT-002: client-server composition exposes HTTP reads and reports unsupported writes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();

    const { hasOperationCapability } = await import('./application-composition');
    const { createClientServerContainer } = await import('./client-server-container');
    const container = createClientServerContainer();

    expect(container.deploymentMode).toBe('client-server');
    expect(container.queryAdapterName).toBe('http');
    expect(hasOperationCapability(container.capabilitySnapshot, 'catalog.datasources.read')).toBe(
      true,
    );
    expect(hasOperationCapability(container.capabilitySnapshot, 'catalog.datasources.write')).toBe(
      false,
    );
    expect(container.catalog.datasources.mutations).toEqual({
      supported: false,
      capabilityId: 'catalog.datasources.write',
      reason: 'Client-server mode exposes catalog writes only when an HTTP write API is composed.',
    });

    await container.catalog.datasources.list.execute();
    expect(fetchMock).toHaveBeenCalledWith('/api/datasources');
  });

  it('IT-003: serverless handler invokes a core use case without browser APIs', async () => {
    vi.resetModules();

    const { createServerlessComposition } = await import('./serverless-composition');
    const { handleServerlessCatalogRequest } = await import('./serverless-handler');
    const composition = createServerlessComposition();

    const created = composition.catalog.datasources.mutations.supported
      ? await composition.catalog.datasources.mutations.useCases.create.execute({
          name: 'Serverless CSV',
          type: 'csv',
          url: '/serverless.csv',
        })
      : null;
    const response = await handleServerlessCatalogRequest(
      { operation: 'datasources.list', correlationId: 'corr-123' },
      composition,
    );

    expect((globalThis as Record<string, unknown>)['localStorage']).toBeUndefined();
    expect(composition.deploymentMode).toBe('serverless');
    expect(response).toEqual({
      statusCode: 200,
      correlationId: 'corr-123',
      body: [created],
    });
  });

  it('ST-001 OT-001: startup log includes mode and capability ids without configuration secrets', async () => {
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
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.resetModules();

    const { createClientOnlyContainer } = await import('./client-only-container');
    createClientOnlyContainer();

    const startupCall = infoSpy.mock.calls.find(([message]) =>
      String(message).includes('[composition.client-only] composition.startup'),
    );
    expect(startupCall).toBeDefined();
    expect(startupCall?.[1]).toEqual({
      deploymentMode: 'client-only',
      enabledCapabilityIds: expect.arrayContaining(['datasource.connector.csv']),
      supportedOperationCapabilityIds: expect.arrayContaining([
        'catalog.datasources.write',
        'query.execute',
      ]),
    });
    expect(JSON.stringify(startupCall)).not.toContain('token');
    expect(JSON.stringify(startupCall)).not.toContain('https://');
  });
});
