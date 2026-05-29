import './datasource-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setCatalogService } from '@/shared/services/catalog-service';

import type { DatasourceEditor } from './datasource-editor';

function mount(props: Partial<DatasourceEditor> = {}): DatasourceEditor {
  const el = document.createElement('datasource-editor') as DatasourceEditor;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

type EditorInternals = {
  _isDirty: boolean;
  _nameError: string;
  _urlError: string;
  _loadError: string;
};

describe('DatasourceEditor willUpdate() — UT-002', () => {
  let getDatasourceExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getDatasourceExecute = vi.fn().mockImplementation(() => new Promise(() => {}));
    setCatalogService({
      listDatasources: { execute: async () => [] },
      getDatasource: {
        execute: getDatasourceExecute as unknown as (id: string) => Promise<unknown>,
      },
      listDashboards: { execute: async () => [] },
      getDashboard: { execute: async () => null },
      getQuestion: { execute: async () => null },
      listQuestions: { execute: async () => [] },
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('UT-002: resets _isDirty, _nameError, _urlError, _loadError and triggers async load when slug changes', async () => {
    const el = mount({ slug: 'ds-a', isNew: false });
    await el.updateComplete;

    const internals = el as unknown as EditorInternals;

    // Simulate dirty / error state from a previous interaction
    (el as unknown as EditorInternals)._isDirty = true;
    (el as unknown as EditorInternals)._nameError = 'some error';
    (el as unknown as EditorInternals)._urlError = 'url error';
    (el as unknown as EditorInternals)._loadError = 'load error';

    getDatasourceExecute.mockClear();

    // Change slug — willUpdate() resets sync state; updated() triggers async load
    el.slug = 'ds-b';
    await el.updateComplete;

    expect(internals._isDirty).toBe(false);
    expect(internals._nameError).toBe('');
    expect(internals._urlError).toBe('');
    expect(internals._loadError).toBe('');
    expect(getDatasourceExecute).toHaveBeenCalledOnce();
    expect(getDatasourceExecute).toHaveBeenCalledWith('ds-b');

    cleanup(el);
  });
});
