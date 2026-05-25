import './datasource-list';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Datasource } from '@/core/entities';
import { getCatalogService, setCatalogService } from '@/shared/services/catalog-service';

let items: Datasource[] = [];

function createSeedDatasource(id: string, name: string): Datasource {
  return {
    id,
    slug: id,
    name,
    type: 'csv',
    url: `https://example.com/${id}.csv`,
    source: 'yaml',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function installCatalogService(): void {
  items = [
    createSeedDatasource('sales', 'sales'),
    createSeedDatasource('customer', 'customer'),
    createSeedDatasource('product', 'product'),
  ];
  setCatalogService({
    listDatasources: { execute: async () => items },
    getDatasource: {
      execute: async (id: string) => items.find((datasource) => datasource.id === id) ?? null,
    },
    createDatasource: {
      execute: async (input: unknown) => {
        const data = input as Pick<Datasource, 'name' | 'type' | 'url'>;
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const datasource: Datasource = {
          ...data,
          id: slug,
          slug,
          source: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
        items = [...items, datasource];
        return datasource;
      },
    },
    deleteDatasource: {
      execute: async (id: string) => {
        items = items.filter((datasource) => datasource.id !== id);
      },
    },
    listQuestions: { execute: async () => [] },
    getQuestion: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
  });
}

function mount(): HTMLElement {
  const el = document.createElement('datasource-list');
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

async function updateComplete(el: HTMLElement): Promise<void> {
  await (el as unknown as { updateComplete: Promise<void> }).updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await (el as unknown as { updateComplete: Promise<void> }).updateComplete;
}

describe('DatasourceList', () => {
  const createdIds: string[] = [];

  beforeEach(() => {
    installCatalogService();
  });

  afterEach(async () => {
    for (const id of createdIds) {
      try {
        await getCatalogService().deleteDatasource!.execute(id);
      } catch {
        /* ignore */
      }
    }
    createdIds.length = 0;
  });

  describe('rendering', () => {
    it('renders seed datasources (sales, customer, product)', async () => {
      const el = mount();
      await updateComplete(el);

      const titles = [...el.querySelectorAll('.collection-list-row-title')].map((n) =>
        n.textContent?.trim(),
      );
      expect(titles).toContain('sales');
      expect(titles).toContain('customer');
      expect(titles).toContain('product');
      cleanup(el);
    });

    it('shows CSV type badge for seed entries', async () => {
      const el = mount();
      await updateComplete(el);

      const badge = el.querySelector('.ds-type-badge');
      expect(badge?.textContent).toContain('CSV');
      cleanup(el);
    });

    it('shows read-only label for yaml-sourced entries', async () => {
      const el = mount();
      await updateComplete(el);

      expect(el.textContent).toContain('read-only');
      cleanup(el);
    });

    it('shows delete button only for user-sourced entries', async () => {
      const ds = (await getCatalogService().createDatasource!.execute({
        name: 'tmp',
        type: 'csv',
        url: 'https://x.com/a.csv',
      })) as Datasource;
      createdIds.push(ds.id);

      const el = mount();
      await updateComplete(el);

      // Seed entries have no delete button; only the user entry has one
      const deleteButtons = el.querySelectorAll('button[aria-label="Delete"]');
      expect(deleteButtons).toHaveLength(1);
      cleanup(el);
    });

    it('renders item count label', async () => {
      const el = mount();
      await updateComplete(el);

      expect(el.textContent).toContain('datasource');
      cleanup(el);
    });
  });

  describe('datasource-select event', () => {
    it('dispatches datasource-select with correct slug on row click', async () => {
      const el = mount();
      await updateComplete(el);

      const received: string[] = [];
      el.addEventListener('datasource-select', (e) =>
        received.push((e as CustomEvent<{ slug: string }>).detail.slug),
      );

      const firstRow = el.querySelector<HTMLElement>('.collection-list-row');
      firstRow?.click();

      expect(received).toHaveLength(1);
      expect(typeof received[0]).toBe('string');
      expect(received[0].length).toBeGreaterThan(0);
      cleanup(el);
    });

    it('dispatches datasource-select on View button click', async () => {
      const el = mount();
      await updateComplete(el);

      const received: string[] = [];
      el.addEventListener('datasource-select', (e) =>
        received.push((e as CustomEvent<{ slug: string }>).detail.slug),
      );

      const viewBtn = el.querySelector<HTMLButtonElement>('button[aria-label="View"]');
      viewBtn?.click();

      expect(received).toHaveLength(1);
      cleanup(el);
    });
  });

  describe('datasource-delete event', () => {
    it('dispatches datasource-delete and removes entry after confirming delete', async () => {
      const ds = (await getCatalogService().createDatasource!.execute({
        name: 'to-delete',
        type: 'csv',
        url: 'https://x.com/d.csv',
      })) as Datasource;
      createdIds.push(ds.id);

      const el = mount();
      await updateComplete(el);

      const received: string[] = [];
      el.addEventListener('datasource-delete', (e) =>
        received.push((e as CustomEvent<{ slug: string }>).detail.slug),
      );

      // Mock confirm to return true
      const origConfirm = window.confirm;
      window.confirm = () => true;

      const deleteBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Delete"]');
      deleteBtn?.click();
      await updateComplete(el);

      window.confirm = origConfirm;

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(ds.slug);
      expect(await getCatalogService().getDatasource.execute(ds.id)).toBeNull();
      cleanup(el);
    });

    it('does not delete when confirm is cancelled', async () => {
      const ds = (await getCatalogService().createDatasource!.execute({
        name: 'no-delete',
        type: 'csv',
        url: 'https://x.com/e.csv',
      })) as Datasource;
      createdIds.push(ds.id);

      const el = mount();
      await updateComplete(el);

      const origConfirm = window.confirm;
      window.confirm = () => false;

      const deleteBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Delete"]');
      deleteBtn?.click();

      window.confirm = origConfirm;

      expect(await getCatalogService().getDatasource.execute(ds.id)).toBeDefined();
      cleanup(el);
    });
  });

  describe('datasource-create event', () => {
    it('opens create dialog on New Datasource click', async () => {
      const el = mount();
      await updateComplete(el);

      const newBtn =
        el.querySelector<HTMLButtonElement>('button[aria-label="New Datasource"]') ??
        el.querySelector<HTMLButtonElement>('button');
      newBtn?.click();
      await updateComplete(el);

      const dialog = el.querySelector('dialog');
      expect(dialog).not.toBeNull();
      cleanup(el);
    });

    it('UX-001: hides create, edit, and delete actions when write capabilities are unsupported', async () => {
      setCatalogService({
        listDatasources: { execute: async () => [createSeedDatasource('sales', 'sales')] },
        getDatasource: { execute: async () => createSeedDatasource('sales', 'sales') },
        listQuestions: { execute: async () => [] },
        getQuestion: { execute: async () => null },
        listDashboards: { execute: async () => [] },
        getDashboard: { execute: async () => null },
      });

      const el = mount();
      await updateComplete(el);

      expect(el.textContent).toContain(
        'Datasource creation is unavailable in this read-only deployment mode.',
      );
      expect(el.querySelector('button[aria-label="New Datasource"]')).toBeNull();
      expect(el.querySelector('button[aria-label="Edit"]')).toBeNull();
      expect(el.querySelector('button[aria-label="Delete"]')).toBeNull();
      cleanup(el);
    });
  });
});
