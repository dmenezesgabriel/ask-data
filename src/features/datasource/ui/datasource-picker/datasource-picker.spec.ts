import './datasource-picker';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setCatalogService } from '@/shared/services/catalog-service';

import type { DatasourcePicker } from './datasource-picker';

function installCatalogService(): void {
  setCatalogService({
    listDatasources: { execute: () => new Promise(() => {}) },
    getDatasource: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
    getQuestion: { execute: async () => null },
    listQuestions: { execute: async () => [] },
  });
}

function mount(props: Partial<DatasourcePicker> = {}): DatasourcePicker {
  const el = document.createElement('datasource-picker') as DatasourcePicker;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

type PickerInternals = {
  _filter: string;
  _pendingSlugs: string[];
  _loading: boolean;
  _error: string;
};

describe('DatasourcePicker willUpdate() — UT-004', () => {
  beforeEach(() => {
    installCatalogService();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('UT-004: resets _filter to "" and mirrors selectedSlugs into _pendingSlugs before render when open becomes true', async () => {
    const el = mount({ open: false, selectedSlugs: ['ds-a', 'ds-b'] });
    await el.updateComplete;

    const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
    vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

    const internals = el as unknown as PickerInternals;
    // Dirty up state to confirm reset
    internals._filter = 'old filter';
    internals._error = 'old error';

    el.open = true;
    await el.updateComplete;

    expect(internals._filter).toBe('');
    expect(internals._pendingSlugs).toEqual(['ds-a', 'ds-b']);
    expect(internals._loading).toBe(true);
    expect(internals._error).toBe('');

    cleanup(el);
  });
});
