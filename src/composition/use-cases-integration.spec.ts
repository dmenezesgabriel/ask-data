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

describe('Task 003: seeded catalog repositories', () => {
  it('UT-001: combines read-only seed datasources with persisted user datasources', async () => {
    const { MemoryDatasourceRepository } =
      await import('@/adapters/memory/memory-datasource-repository');
    const { SeededDatasourceRepository } =
      await import('@/features/catalog/data/seeded-catalog-repositories');
    const { CreateDatasource } =
      await import('@/core/application/use-cases/datasources/create-datasource');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');

    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const repo = new SeededDatasourceRepository(new MemoryDatasourceRepository());
    await new CreateDatasource(repo, { create: () => 'customer-csv-id' }, fakeClock).execute({
      name: 'Customer CSV',
      type: 'csv',
      url: 'https://example.com/customer.csv',
    });

    const list = await new ListDatasources(repo).execute();
    expect(list.some((datasource) => datasource.slug === 'superstore-sales')).toBe(true);
    expect(list.some((datasource) => datasource.id === 'customer-csv-id')).toBe(true);
  });

  it('UT-002: rejects deletion of YAML-seeded datasource records', async () => {
    const { MemoryDatasourceRepository } =
      await import('@/adapters/memory/memory-datasource-repository');
    const { SeededDatasourceRepository } =
      await import('@/features/catalog/data/seeded-catalog-repositories');
    const { DeleteDatasource } =
      await import('@/core/application/use-cases/datasources/delete-datasource');
    const { ListDatasources } =
      await import('@/core/application/use-cases/datasources/list-datasources');

    const repo = new SeededDatasourceRepository(new MemoryDatasourceRepository());

    await expect(new DeleteDatasource(repo).execute('superstore-sales')).rejects.toThrow(
      'Cannot mutate YAML-seeded catalog asset: superstore-sales',
    );
    const list = await new ListDatasources(repo).execute();
    expect(list.some((datasource) => datasource.id === 'superstore-sales')).toBe(true);
  });

  it('UT-003: generates deterministic unique slugs for use-case-created catalog assets', async () => {
    const { MemoryDashboardRepository } =
      await import('@/adapters/memory/memory-dashboard-repository');
    const { MemoryDatasourceRepository } =
      await import('@/adapters/memory/memory-datasource-repository');
    const { MemoryQuestionRepository } =
      await import('@/adapters/memory/memory-question-repository');
    const { CreateDashboard } =
      await import('@/core/application/use-cases/dashboards/create-dashboard');
    const { CreateDatasource } =
      await import('@/core/application/use-cases/datasources/create-datasource');
    const { CreateQuestion } =
      await import('@/core/application/use-cases/questions/create-question');

    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const datasourceRepo = new MemoryDatasourceRepository();
    const questionRepo = new MemoryQuestionRepository();
    const firstDatasource = await new CreateDatasource(
      datasourceRepo,
      { create: () => 'ds-1' },
      fakeClock,
    ).execute({ name: 'Sales', type: 'csv', url: 'https://example.com/a.csv' });
    const secondDatasource = await new CreateDatasource(
      datasourceRepo,
      { create: () => 'ds-2' },
      fakeClock,
    ).execute({ name: 'Sales', type: 'csv', url: 'https://example.com/b.csv' });
    const firstQuestion = await new CreateQuestion(
      questionRepo,
      { create: () => 'q-1' },
      fakeClock,
    ).execute({ title: 'Sales', type: 'chart' });
    const secondQuestion = await new CreateQuestion(
      questionRepo,
      { create: () => 'q-2' },
      fakeClock,
    ).execute({ title: 'Sales', type: 'chart' });
    const dashboardRepo = new MemoryDashboardRepository();
    const firstDashboard = await new CreateDashboard(
      dashboardRepo,
      { create: () => 'dashboard-id' },
      fakeClock,
    ).execute({ name: 'Sales' });
    const secondDashboard = await new CreateDashboard(
      dashboardRepo,
      { create: () => 'dashboard-id-2' },
      fakeClock,
    ).execute({ name: 'Sales' });

    expect(firstDatasource.slug).toBe('sales');
    expect(secondDatasource.slug).toBe('sales-2');
    expect(firstQuestion.slug).toBe('sales');
    expect(secondQuestion.slug).toBe('sales-2');
    expect(firstDashboard.id).toBe('sales');
    expect(secondDashboard.id).toBe('sales-2');
  });

  it('IT-002: user questions survive reload through the seeded question repository path', async () => {
    const { localStorage: lsMock } = createLocalStorageMock();
    vi.stubGlobal('localStorage', lsMock);

    const { LocalStorageQuestionRepository } =
      await import('@/adapters/client/local-storage/local-storage-question-repository');
    const { SeededQuestionRepository } =
      await import('@/features/catalog/data/seeded-catalog-repositories');
    const { CreateQuestion } =
      await import('@/core/application/use-cases/questions/create-question');
    const { ListQuestions } = await import('@/core/application/use-cases/questions/list-questions');

    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const createRepo = new SeededQuestionRepository(new LocalStorageQuestionRepository(fakeClock));
    const created = await new CreateQuestion(
      createRepo,
      { create: () => 'user-question-id' },
      fakeClock,
    ).execute({
      title: 'Customer Growth',
      type: 'chart',
      queryType: 'sql',
      query: 'SELECT 1',
    });

    const reloadedRepo = new SeededQuestionRepository(
      new LocalStorageQuestionRepository(fakeClock),
    );
    const list = await new ListQuestions(reloadedRepo).execute();

    expect(list.some((question) => question.id === created.id)).toBe(true);
    expect(list.some((question) => question.source === 'yaml')).toBe(true);
  });

  it('REG-001: rejects deletion of YAML-seeded question and dashboard records', async () => {
    const { MemoryDashboardRepository } =
      await import('@/adapters/memory/memory-dashboard-repository');
    const { MemoryQuestionRepository } =
      await import('@/adapters/memory/memory-question-repository');
    const {
      SeededDashboardRepository,
      SeededQuestionRepository,
      createSeedDashboards,
      createSeedQuestions,
    } = await import('@/features/catalog/data/seeded-catalog-repositories');
    const { DeleteDashboard } =
      await import('@/core/application/use-cases/dashboards/delete-dashboard');
    const { DeleteQuestion } =
      await import('@/core/application/use-cases/questions/delete-question');
    const { ListDashboards } =
      await import('@/core/application/use-cases/dashboards/list-dashboards');
    const { ListQuestions } = await import('@/core/application/use-cases/questions/list-questions');

    const seedQuestionId = createSeedQuestions()[0].id;
    const seedDashboardId = createSeedDashboards()[0].id;
    const questionRepo = new SeededQuestionRepository(new MemoryQuestionRepository());
    const dashboardRepo = new SeededDashboardRepository(new MemoryDashboardRepository());

    await expect(new DeleteQuestion(questionRepo).execute(seedQuestionId)).rejects.toThrow(
      `Cannot mutate YAML-seeded catalog asset: ${seedQuestionId}`,
    );
    await expect(new DeleteDashboard(dashboardRepo).execute(seedDashboardId)).rejects.toThrow(
      `Cannot mutate YAML-seeded catalog asset: ${seedDashboardId}`,
    );

    expect(
      (await new ListQuestions(questionRepo).execute()).some(
        (question) => question.id === seedQuestionId,
      ),
    ).toBe(true);
    expect(
      (await new ListDashboards(dashboardRepo).execute()).some(
        (dashboard) => dashboard.id === seedDashboardId,
      ),
    ).toBe(true);
  });

  it('OT-001: catalog mutation failures emit redacted failure logs', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { CreateDatasource } =
      await import('@/core/application/use-cases/datasources/create-datasource');
    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };
    const failingRepo = {
      list: async () => [],
      get: async () => null,
      save: async () => {
        throw new Error('storage failed');
      },
      delete: async () => undefined,
    };

    await expect(
      new CreateDatasource(failingRepo, { create: () => 'secret-ds' }, fakeClock).execute({
        name: 'Secret Source',
        type: 'csv',
        url: 'https://secret.example.com/private.csv',
      }),
    ).rejects.toThrow('storage failed');

    const logged = JSON.stringify(error.mock.calls);
    expect(logged).toContain('"assetType":"datasource"');
    expect(logged).toContain('"operation":"create"');
    expect(logged).toContain('"result":"failure"');
    expect(logged).not.toContain('https://secret.example.com/private.csv');
  });

  it('ST-001: repository failure logs omit datasource URLs, SQL bodies, and dashboard JSON', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
      removeItem: () => undefined,
      clear: () => undefined,
    };
    vi.stubGlobal('localStorage', throwingStorage);

    const { LocalStorageDatasourceRepository } =
      await import('@/adapters/client/local-storage/local-storage-datasource-repository');
    const { LocalStorageQuestionRepository } =
      await import('@/adapters/client/local-storage/local-storage-question-repository');
    const { LocalStorageDashboardRepository } =
      await import('@/adapters/client/local-storage/local-storage-dashboard-repository');
    const fakeClock = { now: () => '2026-01-01T00:00:00.000Z' };

    await new LocalStorageDatasourceRepository(fakeClock).save({
      id: 'secret-ds',
      slug: 'secret-ds',
      name: 'Secret Datasource',
      type: 'csv',
      url: 'https://secret.example.com/customer.csv',
      source: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await new LocalStorageQuestionRepository(fakeClock).save({
      id: 'secret-question',
      slug: 'secret-question',
      title: 'Secret Question',
      type: 'chart',
      queryType: 'sql',
      query: 'SELECT * FROM secret_customer_table',
      source: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await new LocalStorageDashboardRepository().save({
      id: 'secret-dashboard',
      name: 'Secret Dashboard',
      type: 'dashboard',
      widgets: [
        {
          id: 'w1',
          type: 'chart',
          title: 'Secret Widget',
          query: 'SELECT * FROM private_dashboard_json',
        },
      ],
      layout: [],
    });

    const logged = JSON.stringify(error.mock.calls);
    expect(logged).toContain('"assetType":"datasource"');
    expect(logged).toContain('"assetType":"question"');
    expect(logged).toContain('"assetType":"dashboard"');
    expect(logged).not.toContain('https://secret.example.com/customer.csv');
    expect(logged).not.toContain('SELECT * FROM secret_customer_table');
    expect(logged).not.toContain('private_dashboard_json');
  });

  it('IT-003: lists legacy dashboard storage through the dashboard repository path', async () => {
    const { store, localStorage: lsMock } = createLocalStorageMock();
    store.set(
      'persisted_dashboards_v1',
      JSON.stringify([
        {
          slug: 'legacy-dashboard',
          config: {
            title: 'Legacy Dashboard',
            subtitle: 'Still visible',
            askData: { defaultQuestion: '' },
            filters: [],
            kpis: [],
            charts: [],
            tables: [],
            layout: [],
            relationships: [],
          },
        },
      ]),
    );
    vi.stubGlobal('localStorage', lsMock);

    const { LocalStorageDashboardRepository } =
      await import('@/adapters/client/local-storage/local-storage-dashboard-repository');
    const { SeededDashboardRepository } =
      await import('@/features/catalog/data/seeded-catalog-repositories');
    const { ListDashboards } =
      await import('@/core/application/use-cases/dashboards/list-dashboards');

    const repo = new SeededDashboardRepository(new LocalStorageDashboardRepository());
    const list = await new ListDashboards(repo).execute();

    expect(list.some((dashboard) => dashboard.id === 'legacy-dashboard')).toBe(true);
  });
});
