import './index';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setCatalogService } from '@/shared/services/catalog-service';

import { QuestionEditor } from './question-editor';

function mount(props: Partial<QuestionEditor> = {}): QuestionEditor {
  const el = document.createElement('question-editor') as QuestionEditor;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

type EditorInternals = { _isDirty: boolean; _error: string };

describe('QuestionEditor willUpdate() — UT-003', () => {
  let getQuestionExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getQuestionExecute = vi.fn().mockImplementation(() => new Promise(() => {}));
    setCatalogService({
      listQuestions: { execute: async () => [] },
      getQuestion: { execute: getQuestionExecute as unknown as (id: string) => Promise<unknown> },
      listDatasources: { execute: async () => [] },
      getDatasource: { execute: async () => null },
      listDashboards: { execute: async () => [] },
      getDashboard: { execute: async () => null },
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('UT-003: resets _isDirty and _error and triggers async load when slug changes', async () => {
    const el = mount({ slug: 'q-a', isNew: false });
    await el.updateComplete;

    const internals = el as unknown as EditorInternals;

    // Simulate dirty / error state from a previous interaction
    (el as unknown as EditorInternals)._isDirty = true;
    (el as unknown as EditorInternals)._error = 'some error';

    getQuestionExecute.mockClear();

    // Change slug — willUpdate() resets sync state; updated() triggers async load
    el.slug = 'q-b';
    await el.updateComplete;

    expect(internals._isDirty).toBe(false);
    expect(internals._error).toBe('');
    expect(getQuestionExecute).toHaveBeenCalledOnce();
    expect(getQuestionExecute).toHaveBeenCalledWith('q-b');

    cleanup(el);
  });
});
