import '../../../dashboard/ui/widget';
import './index';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AskEngineFactory, DataSourceManager, QueryPort } from '@/core/application/ports';
import type { Datasource, Question as QuestionConfig } from '@/core/entities';
import type { CapabilitySnapshot } from '@/core/platform';
import { setCatalogService } from '@/shared/services/catalog-service';

import type { QuestionEditorPanel } from './question-editor-panel';

function makeConfig(overrides: Partial<QuestionConfig> = {}): QuestionConfig {
  return {
    id: 'test-q',
    slug: 'test-q',
    title: 'Test Question',
    type: 'chart',
    chartType: 'bar',
    source: 'user',
    dataSourceSlugs: ['superstore-sales'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mount(
  props: Partial<{
    config: QuestionConfig;
    queryPort: QueryPort;
    dataSourceManager: DataSourceManager;
    createAskEngine: AskEngineFactory;
    capabilitySnapshot: CapabilitySnapshot;
  }> = {},
): QuestionEditorPanel {
  const el = document.createElement('question-editor-panel') as QuestionEditorPanel;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

async function updateComplete(el: QuestionEditorPanel): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

function installCatalogService(): void {
  const datasources: Datasource[] = [
    {
      id: 'superstore-sales',
      slug: 'superstore-sales',
      name: 'Superstore Sales',
      type: 'csv',
      url: 'https://example.com/sales.csv',
      source: 'yaml',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  setCatalogService({
    listDatasources: { execute: async () => datasources },
    getDatasource: {
      execute: async (id: string) => datasources.find((datasource) => datasource.id === id) ?? null,
    },
    listQuestions: { execute: async () => [] },
    getQuestion: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
  });
}

describe('QuestionEditorPanel', () => {
  beforeEach(() => {
    installCatalogService();
  });

  describe('_runSqlPreview()', () => {
    it('converts BigInt values to Number in row data', async () => {
      const queryPort: QueryPort = {
        query: vi.fn().mockResolvedValue({
          rows: [
            { label: 'West', value: 9n },
            { label: 'East', value: 15n },
          ],
        }),
      };
      const dataSourceManager: DataSourceManager = {
        createViews: vi.fn().mockResolvedValue(undefined),
      };
      const el = mount({
        config: makeConfig({ queryType: 'sql', query: 'SELECT region, sales FROM sales' }),
        queryPort,
        dataSourceManager,
      });
      await updateComplete(el);

      await el.runPreview();
      await updateComplete(el);

      const widget = el.querySelector('app-widget')!;
      const data = (widget as unknown as Record<string, unknown>).data as {
        labels: string[];
        values: number[];
        rows: Record<string, unknown>[];
      };
      expect(data.values).toEqual([9, 15]);
      expect(typeof data.values[0]).toBe('number');
      expect(typeof data.rows[0].value).toBe('number');
      cleanup(el);
    });

    it('uses first key as label when no label key, second key as value when no value key', async () => {
      const queryPort: QueryPort = {
        query: vi.fn().mockResolvedValue({
          rows: [
            { region: 'West', sales: 100 },
            { region: 'East', sales: 200 },
          ],
        }),
      };
      const dataSourceManager: DataSourceManager = {
        createViews: vi.fn().mockResolvedValue(undefined),
      };
      const el = mount({
        config: makeConfig({ queryType: 'sql', query: 'SELECT region, sales FROM sales' }),
        queryPort,
        dataSourceManager,
      });
      await updateComplete(el);

      await el.runPreview();
      await updateComplete(el);

      const widget = el.querySelector('app-widget')!;
      const data = (widget as unknown as Record<string, unknown>).data as {
        labels: string[];
        values: number[];
        rows: Record<string, unknown>[];
      };
      expect(data.labels).toEqual(['West', 'East']);
      expect(data.values).toEqual([100, 200]);
      cleanup(el);
    });

    it('logs warning when query returns zero rows', async () => {
      const queryPort: QueryPort = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      const dataSourceManager: DataSourceManager = {
        createViews: vi.fn().mockResolvedValue(undefined),
      };
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = mount({
        config: makeConfig({ queryType: 'sql', query: 'SELECT region, sales FROM sales' }),
        queryPort,
        dataSourceManager,
      });
      await updateComplete(el);

      await el.runPreview();
      await updateComplete(el);

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('query.zeroRows'),
        expect.objectContaining({ query: 'SELECT region, sales FROM sales' }),
      );
      warn.mockRestore();
      cleanup(el);
    });
  });

  it('runs SQL preview through fake query and datasource ports', async () => {
    const queryPort: QueryPort = {
      query: vi.fn().mockResolvedValue({ rows: [{ label: 'West', value: 9 }] }),
    };
    const dataSourceManager: DataSourceManager = {
      createViews: vi.fn().mockResolvedValue(undefined),
    };
    const el = mount({
      config: makeConfig({ queryType: 'sql', query: 'SELECT region, sales FROM sales' }),
      queryPort,
      dataSourceManager,
    });
    await updateComplete(el);

    await el.runPreview();
    await updateComplete(el);

    expect(dataSourceManager.createViews).toHaveBeenCalledOnce();
    expect(queryPort.query).toHaveBeenCalledWith('SELECT region, sales FROM sales');
    expect(el.querySelector('app-widget')).not.toBeNull();
    expect(el.querySelector('app-widget canvas')).not.toBeNull();
    cleanup(el);
  });

  it('runs natural-language preview through a fake Ask Data engine', async () => {
    const queryPort: QueryPort = { query: vi.fn() };
    const dataSourceManager: DataSourceManager = {
      createViews: vi.fn().mockResolvedValue(undefined),
    };
    const askEngine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      ask: vi.fn().mockResolvedValue({
        sql: 'SELECT region, sales FROM sales',
        rows: [{ label: 'West', value: 9 }],
        columns: ['label', 'value'],
      }),
    };
    const createAskEngine: AskEngineFactory = vi.fn().mockReturnValue(askEngine);
    const el = mount({
      config: makeConfig({ queryType: 'nl', nlQuery: 'sales by region' }),
      queryPort,
      dataSourceManager,
      createAskEngine,
    });
    await updateComplete(el);

    await el.runPreview();
    await updateComplete(el);

    expect(dataSourceManager.createViews).toHaveBeenCalledOnce();
    expect(createAskEngine).toHaveBeenCalledOnce();
    expect(askEngine.ask).toHaveBeenCalledWith('sales by region', {});
    expect(queryPort.query).not.toHaveBeenCalled();
    expect(el.querySelector('app-widget')).not.toBeNull();
    cleanup(el);
  });

  it('converts BigInt values to Number in natural-language preview row data', async () => {
    const queryPort: QueryPort = { query: vi.fn() };
    const dataSourceManager: DataSourceManager = {
      createViews: vi.fn().mockResolvedValue(undefined),
    };
    const askEngine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      ask: vi.fn().mockResolvedValue({
        sql: 'SELECT region, sales FROM sales',
        rows: [
          { label: 'West', value: 9n },
          { label: 'East', value: 15n },
        ],
        columns: ['label', 'value'],
      }),
    };
    const createAskEngine: AskEngineFactory = vi.fn().mockReturnValue(askEngine);
    const el = mount({
      config: makeConfig({ queryType: 'nl', nlQuery: 'sales by region' }),
      queryPort,
      dataSourceManager,
      createAskEngine,
    });
    await updateComplete(el);

    await el.runPreview();
    await updateComplete(el);

    const widget = el.querySelector('app-widget')!;
    const data = (widget as unknown as Record<string, unknown>).data as {
      labels: string[];
      values: number[];
      rows: Record<string, unknown>[];
    };
    expect(data.values).toEqual([9, 15]);
    expect(typeof data.values[0]).toBe('number');
    expect(typeof data.rows[0].value).toBe('number');
    cleanup(el);
  });

  it('shows recoverable feedback when question SQL preview fails', async () => {
    const queryPort: QueryPort = { query: vi.fn().mockRejectedValue(new Error('Query failed')) };
    const dataSourceManager: DataSourceManager = {
      createViews: vi.fn().mockResolvedValue(undefined),
    };
    const el = mount({
      config: makeConfig({ queryType: 'sql', query: 'SELECT broken FROM sales' }),
      queryPort,
      dataSourceManager,
    });
    await updateComplete(el);

    await el.runPreview();
    await updateComplete(el);

    expect(el.querySelector('.qep-preview-error')?.textContent).toContain('Query failed');
    expect(el.querySelector<HTMLButtonElement>('.qep-run-btn')?.disabled).toBe(false);
    cleanup(el);
  });

  it('shows error when runPreview is clicked with no linked datasources', async () => {
    const el = mount({
      config: makeConfig({ queryType: 'sql', query: 'SELECT 1', dataSourceSlugs: [] }),
    });
    await updateComplete(el);

    await el.runPreview();
    await updateComplete(el);

    expect(el.querySelector('.qep-preview-error')?.textContent).toContain(
      'Link at least one datasource',
    );
    cleanup(el);
  });

  describe('_renderPreview()', () => {
    it('renders app-widget (not the old widget tag) when preview data is set', async () => {
      const el = mount({ config: makeConfig() });
      await updateComplete(el);

      // Inject preview data by calling runPreview's internal state directly via the public method path:
      // We reach the preview state by accessing the private field via a cast.
      (el as unknown as Record<string, unknown>)['_previewData'] = {
        labels: ['A', 'B'],
        values: [1, 2],
        rows: [],
      };
      el.requestUpdate();
      await updateComplete(el);

      expect(el.querySelector('app-widget')).not.toBeNull();
      expect(el.querySelector('widget')).toBeNull();
      cleanup(el);
    });

    it('does not render app-widget when there is no preview data', async () => {
      const el = mount({ config: makeConfig() });
      await updateComplete(el);

      expect(el.querySelector('app-widget')).toBeNull();
      cleanup(el);
    });

    it('renders placeholder when no datasource slugs are configured', async () => {
      const el = mount({ config: makeConfig({ dataSourceSlugs: [] }) });
      await updateComplete(el);

      expect(el.querySelector('.qep-preview-placeholder')?.textContent).toContain(
        'Link a datasource',
      );
      cleanup(el);
    });

    it('renders "Run preview" placeholder when datasource slugs are set but no preview yet', async () => {
      const el = mount({ config: makeConfig() });
      await updateComplete(el);

      expect(el.querySelector('.qep-preview-placeholder')?.textContent).toContain('Run preview');
      cleanup(el);
    });
  });

  describe('rendering', () => {
    it('renders the title input with the config title', async () => {
      const el = mount({ config: makeConfig({ title: 'My Chart' }) });
      await el.updateComplete;

      const input = el.querySelector<HTMLInputElement>('#qep-title')!;
      expect(input.value).toBe('My Chart');
      cleanup(el);
    });

    it('AC-001: hides flag-disabled visualization choices', async () => {
      const capabilitySnapshot: CapabilitySnapshot = {
        capabilities: [
          {
            id: 'visualization.chart.bar',
            displayName: 'bar chart',
            contributionType: 'widget-renderer',
            enabled: true,
          },
        ],
      };
      const el = mount({ config: makeConfig(), capabilitySnapshot });
      await el.updateComplete;

      const options = [...el.querySelectorAll('.qep-select option')].map((option) =>
        option.getAttribute('value'),
      );
      expect(options).toContain('bar');
      expect(options).not.toContain('pie');
      cleanup(el);
    });

    it('renders nothing when config is null', async () => {
      const el = mount({ config: undefined as unknown as QuestionConfig });
      await el.updateComplete;

      expect(el.querySelector('.qep-layout')).toBeNull();
      cleanup(el);
    });
  });

  describe('_renderQuerySection()', () => {
    it('renders ui-code-editor when queryType is "sql"', async () => {
      const el = mount({ config: makeConfig({ queryType: 'sql', query: 'SELECT 1' }) });
      await el.updateComplete;

      expect(el.querySelector('ui-code-editor')).not.toBeNull();
      expect(el.querySelector('textarea.qep-query-input')).toBeNull();
      cleanup(el);
    });

    it('renders a textarea when queryType is "nl"', async () => {
      const el = mount({ config: makeConfig({ queryType: 'nl', nlQuery: 'active users' }) });
      await el.updateComplete;

      expect(el.querySelector('textarea.qep-query-input')).not.toBeNull();
      expect(el.querySelector('ui-code-editor')).toBeNull();
      cleanup(el);
    });

    it('emits panel-change with updated query on ui-code-editor value-change', async () => {
      const el = mount({ config: makeConfig({ queryType: 'sql', query: '' }) });
      await el.updateComplete;

      const received: QuestionConfig[] = [];
      el.addEventListener('panel-change', (e) =>
        received.push((e as CustomEvent<QuestionConfig>).detail),
      );

      const editor = el.querySelector('ui-code-editor')!;
      editor.dispatchEvent(
        new CustomEvent<string>('value-change', {
          detail: 'SELECT 2',
          bubbles: true,
          composed: true,
        }),
      );

      expect(received).toHaveLength(1);
      expect(received[0].query).toBe('SELECT 2');
      cleanup(el);
    });

    it('emits panel-change with updated nlQuery on NL textarea input', async () => {
      const el = mount({ config: makeConfig({ queryType: 'nl', nlQuery: '' }) });
      await el.updateComplete;

      const received: QuestionConfig[] = [];
      el.addEventListener('panel-change', (e) =>
        received.push((e as CustomEvent<QuestionConfig>).detail),
      );

      const textarea = el.querySelector<HTMLTextAreaElement>('textarea.qep-query-input')!;
      textarea.value = 'revenue by month';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      expect(received).toHaveLength(1);
      expect(received[0].nlQuery).toBe('revenue by month');
      cleanup(el);
    });

    it('SQL value-change does not touch nlQuery', async () => {
      const el = mount({ config: makeConfig({ queryType: 'sql', query: '', nlQuery: 'kept' }) });
      await el.updateComplete;

      const received: QuestionConfig[] = [];
      el.addEventListener('panel-change', (e) =>
        received.push((e as CustomEvent<QuestionConfig>).detail),
      );

      const editor = el.querySelector('ui-code-editor')!;
      editor.dispatchEvent(
        new CustomEvent<string>('value-change', {
          detail: 'SELECT 1',
          bubbles: true,
          composed: true,
        }),
      );

      expect(received[0].nlQuery).toBe('kept');
      cleanup(el);
    });

    it('NL textarea input does not touch query', async () => {
      const el = mount({
        config: makeConfig({ queryType: 'nl', nlQuery: '', query: 'SELECT kept' }),
      });
      await el.updateComplete;

      const received: QuestionConfig[] = [];
      el.addEventListener('panel-change', (e) =>
        received.push((e as CustomEvent<QuestionConfig>).detail),
      );

      const textarea = el.querySelector<HTMLTextAreaElement>('textarea.qep-query-input')!;
      textarea.value = 'new nl';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      expect(received[0].query).toBe('SELECT kept');
      cleanup(el);
    });

    it('NL textarea shows nlQuery when set', async () => {
      const el = mount({ config: makeConfig({ queryType: 'nl', nlQuery: 'top products' }) });
      await el.updateComplete;

      const textarea = el.querySelector<HTMLTextAreaElement>('textarea.qep-query-input')!;
      expect(textarea.value).toBe('top products');
      cleanup(el);
    });

    it('NL textarea is empty when nlQuery is undefined', async () => {
      const el = mount({
        config: makeConfig({ queryType: 'nl', nlQuery: undefined, query: 'SELECT 1' }),
      });
      await el.updateComplete;

      const textarea = el.querySelector<HTMLTextAreaElement>('textarea.qep-query-input')!;
      expect(textarea.value).toBe('');
      cleanup(el);
    });
  });
});
