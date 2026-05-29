import './index';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Question as QuestionConfig } from '@/core/entities';
import { setCatalogService } from '@/shared/services/catalog-service';

import type { QuestionPicker } from './question-picker';

const STUB_QUESTION: QuestionConfig = {
  id: 'q1',
  slug: 'q1',
  title: 'Question 1',
  type: 'chart',
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function installCatalogService(questions: QuestionConfig[] = []): void {
  setCatalogService({
    listQuestions: { execute: async () => questions },
    listDatasources: { execute: async () => [] },
    getDatasource: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
    getQuestion: { execute: async () => null },
  });
}

/** Never resolves — keeps _loading=true so timing-sensitive tests can observe it. */
function installHangingCatalogService(): void {
  setCatalogService({
    listQuestions: { execute: () => new Promise<QuestionConfig[]>(() => {}) },
    listDatasources: { execute: async () => [] },
    getDatasource: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
    getQuestion: { execute: async () => null },
  });
}

function mount(props: Partial<{ open: boolean }> = {}): QuestionPicker {
  const el = document.createElement('question-picker') as QuestionPicker;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement): void {
  el.remove();
}

type PickerInternals = { _loading: boolean; _filter: string; _items: QuestionConfig[] };

describe('QuestionPicker', () => {
  beforeEach(() => {
    installCatalogService([STUB_QUESTION]);
  });

  describe('willUpdate() — state reset on open (UT-001)', () => {
    beforeEach(() => {
      installHangingCatalogService();
    });

    it('sets _loading=true and _filter="" before render when open transitions to true', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      // willUpdate ran before render; _loadItems() async hasn't resolved yet
      const internals = el as unknown as PickerInternals;
      expect(internals._loading).toBe(true);
      expect(internals._filter).toBe('');

      cleanup(el);
    });
  });

  describe('_loadItems() — async resolution (UT-002)', () => {
    it('sets _loading=false and populates _items after resolving', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      // flush the async _loadItems() microtask and the resulting Lit update
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      const internals = el as unknown as PickerInternals;
      expect(internals._loading).toBe(false);
      expect(internals._items).toHaveLength(1);

      cleanup(el);
    });
  });

  describe('IT-001: open → close → open lifecycle', () => {
    beforeEach(() => {
      installHangingCatalogService();
    });

    it('resets filter and shows loading on second open', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});
      vi.spyOn(dialog, 'close').mockImplementation(() => {});

      // first open
      el.open = true;
      await el.updateComplete;

      // simulate user entering a filter term
      (el as unknown as PickerInternals)._filter = 'something';
      await el.updateComplete;

      // close
      el.open = false;
      await el.updateComplete;

      // second open
      el.open = true;
      await el.updateComplete;

      const internals = el as unknown as PickerInternals;
      expect(internals._filter).toBe('');
      expect(internals._loading).toBe(true);

      cleanup(el);
    });
  });

  describe('updated() — showModal()', () => {
    it('calls showModal() synchronously when open transitions to true', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      const showModal = vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      expect(showModal).toHaveBeenCalledOnce();
      cleanup(el);
    });

    it('calls close() when open transitions to false', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      const closeSpy = vi.spyOn(dialog, 'close').mockImplementation(() => {});
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      el.open = false;
      await el.updateComplete;

      expect(closeSpy).toHaveBeenCalledOnce();
      cleanup(el);
    });
  });

  describe('_close()', () => {
    it('does NOT emit picker-close when close button is clicked', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});
      vi.spyOn(dialog, 'close').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      const handler = vi.fn();
      el.addEventListener('picker-close', handler);

      const closeBtn = el.querySelector<HTMLButtonElement>('.qpicker-close')!;
      closeBtn.click();

      expect(handler).not.toHaveBeenCalled();
      cleanup(el);
    });
  });

  describe('_onNativeClose()', () => {
    it('emits picker-close when the native close event fires on the dialog', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      const handler = vi.fn();
      el.addEventListener('picker-close', handler);

      dialog.dispatchEvent(new Event('close'));

      expect(handler).toHaveBeenCalledOnce();
      cleanup(el);
    });
  });

  describe('SMK-001: no Lit scheduling warning on open', () => {
    it('does not emit a console.warn containing "scheduled an update" when opened', async () => {
      const warnSpy = vi.spyOn(console, 'warn');

      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      const hasSchedulingWarning = warnSpy.mock.calls.some((args) =>
        args.some((a) => typeof a === 'string' && a.includes('scheduled an update')),
      );
      expect(hasSchedulingWarning).toBe(false);

      cleanup(el);
      warnSpy.mockRestore();
    });
  });

  describe('REG-001: question-attach event on item selection', () => {
    it('dispatches question-attach with the selected question when an item is clicked', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      const dialog = el.querySelector<HTMLDialogElement>('dialog.qpicker-modal')!;
      vi.spyOn(dialog, 'showModal').mockImplementation(() => {});
      vi.spyOn(dialog, 'close').mockImplementation(() => {});

      el.open = true;
      await el.updateComplete;

      // wait for _loadItems() to resolve and re-render
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;

      const handler = vi.fn();
      el.addEventListener('question-attach', handler);

      const itemBtn = el.querySelector<HTMLButtonElement>('.qpicker-item')!;
      itemBtn.click();

      expect(handler).toHaveBeenCalledOnce();
      expect((handler.mock.calls[0]![0] as CustomEvent<typeof STUB_QUESTION>).detail).toEqual(
        STUB_QUESTION,
      );

      cleanup(el);
    });
  });

  describe('rendering', () => {
    it('renders the dialog with the qpicker-modal class', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      expect(el.querySelector('dialog.qpicker-modal')).not.toBeNull();
      cleanup(el);
    });

    it('renders the title "Add from library"', async () => {
      const el = mount({ open: false });
      await el.updateComplete;

      expect(el.querySelector('.qpicker-title')?.textContent?.trim()).toBe('Add from library');
      cleanup(el);
    });
  });
});
