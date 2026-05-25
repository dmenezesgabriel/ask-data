import './index';

import { describe, expect, it, vi } from 'vitest';

import type { DataSourceManager, QueryPort } from '@/core/application/ports';
import type { DashboardWidget as WidgetConfig } from '@/core/entities';

import { DashboardWorkspace } from './dashboard-workspace';

function mount(): DashboardWorkspace {
  const el = document.createElement('dashboard-workspace') as DashboardWorkspace;
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

describe('DashboardWorkspace — overflow menu alignment', () => {
  it('sets _overflowMenuAlign to "left" when there is enough room to the right', async () => {
    const el = mount();
    await el.updateComplete;

    const btn = el.querySelector<HTMLButtonElement>('.toolbar-overflow-btn')!;

    // Simulate button positioned far from the right edge
    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
      right: 100,
      left: 80,
      top: 0,
      bottom: 40,
      width: 20,
      height: 40,
      x: 80,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

    btn.click();
    await el.updateComplete;

    const menu = el.querySelector<HTMLDivElement>('.toolbar-overflow-menu');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('style')).toContain('left: 0');

    cleanup(el);
  });

  it('sets _overflowMenuAlign to "right" when there is not enough room to the right', async () => {
    const el = mount();
    await el.updateComplete;

    const btn = el.querySelector<HTMLButtonElement>('.toolbar-overflow-btn')!;

    // Simulate button positioned close to the right edge: rect.right + 160 > window.innerWidth
    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
      right: 1100,
      left: 1080,
      top: 0,
      bottom: 40,
      width: 20,
      height: 40,
      x: 1080,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

    btn.click();
    await el.updateComplete;

    const menu = el.querySelector<HTMLDivElement>('.toolbar-overflow-menu');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('style')).toContain('right: 0');

    cleanup(el);
  });

  it('does not recompute alignment when closing the menu (toggle off)', async () => {
    const el = mount();
    await el.updateComplete;

    const btn = el.querySelector<HTMLButtonElement>('.toolbar-overflow-btn')!;

    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
      right: 100,
      left: 80,
      top: 0,
      bottom: 40,
      width: 20,
      height: 40,
      x: 80,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

    // Open menu
    btn.click();
    await el.updateComplete;

    // Close menu by clicking again
    btn.click();
    await el.updateComplete;

    expect(el.querySelector('.toolbar-overflow-menu')).toBeNull();
    cleanup(el);
  });
});

describe('DashboardWorkspace query execution', () => {
  it('UT-003: delegates dashboard widget SQL through injected query and datasource ports', async () => {
    const queryPort: QueryPort = { query: vi.fn().mockResolvedValue({ rows: [{ label: 'West', value: 7 }] }) };
    const dataSourceManager: DataSourceManager = { createViews: vi.fn().mockResolvedValue(undefined) };
    const el = mount();
    el.queryPort = queryPort;
    el.dataSourceManager = dataSourceManager;
    el.config = { ...el.config, dataSourceSlugs: ['sales'], filters: [] };
    (el as unknown as { _datasources: unknown[] })._datasources = [
      {
        id: 'sales',
        slug: 'sales',
        name: 'sales',
        type: 'csv',
        url: 'https://example.com/sales.csv',
      },
    ];
    const widget: WidgetConfig = {
      id: 'widget-1',
      type: 'chart',
      title: 'Sales',
      queryType: 'sql',
      query: 'SELECT region AS label, sales AS value FROM sales',
    };

    const result = await (
      el as unknown as {
        _executeSqlQuery(widget: WidgetConfig): Promise<{ labels: string[]; values: number[] }>;
      }
    )._executeSqlQuery(widget);

    expect(dataSourceManager.createViews).toHaveBeenCalledWith([
      expect.objectContaining({ slug: 'sales' }),
    ]);
    expect(queryPort.query).toHaveBeenCalledWith('SELECT region AS label, sales AS value FROM sales');
    expect(result.labels).toEqual(['West']);
    expect(result.values).toEqual([7]);
    cleanup(el);
  });

  it('UX-001: shows recoverable feedback when dashboard widget execution fails', async () => {
    const queryPort: QueryPort = { query: vi.fn().mockRejectedValue(new Error('Widget failed')) };
    const dataSourceManager: DataSourceManager = { createViews: vi.fn().mockResolvedValue(undefined) };
    const el = mount();
    el.queryPort = queryPort;
    el.dataSourceManager = dataSourceManager;
    el.config = { ...el.config, dataSourceSlugs: ['sales'], filters: [] };
    await el.updateComplete;
    el.sheets = [
      {
        id: 'sheet-1',
        name: 'Sales',
        type: 'dashboard',
        widgets: [
          {
            id: 'widget-1',
            type: 'chart',
            title: 'Sales',
            queryType: 'sql',
            query: 'SELECT broken FROM sales',
          },
        ],
        layout: [{ x: 0, y: 0, w: 4, h: 3 }],
        filters: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    el.activeSheetId = 'sheet-1';
    (el as unknown as { _datasources: unknown[] })._datasources = [
      {
        id: 'sales',
        slug: 'sales',
        name: 'sales',
        type: 'csv',
        url: 'https://example.com/sales.csv',
      },
    ];

    await (el as unknown as { _loadWidgetData(): Promise<void> })._loadWidgetData();
    await el.updateComplete;
    const canvas = el.querySelector('dashboard-canvas') as HTMLElement & {
      updateComplete: Promise<void>;
    };
    await canvas.updateComplete;
    const widgetEl = el.querySelector('app-widget') as HTMLElement & { updateComplete: Promise<void> };
    await widgetEl.updateComplete;

    expect(el.widgetErrors['widget-1']).toContain('Widget failed');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Widget failed');
    cleanup(el);
  });
});
