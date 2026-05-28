import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import type { Question as QuestionConfig } from '@/core/entities';
import { getCatalogService } from '@/shared/services/catalog-service';

const TYPE_ICONS: Record<string, string> = {
  chart: '📊',
  table: '⊞',
  kpi: '◈',
  text: '¶',
};

export class QuestionPicker extends LitElement {
  static override readonly properties = {
    open: { type: Boolean },
    _filter: { state: true },
    _items: { state: true },
    _loading: { state: true },
    _error: { state: true },
  };

  open = false;
  private _filter = '';
  private _items: QuestionConfig[] = [];
  private _loading = false;
  private _error = '';
  private _dialogRef = createRef<HTMLDialogElement>();

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('open') && this.open) {
      this._filter = '';
      this._loading = true;
      this._error = '';
    }
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      if (this.open) {
        void this._loadItems();
        try {
          this._dialogRef.value?.showModal();
        } catch (err) {
          console.error('[question-picker] showModal failed:', err);
        }
      } else {
        this._dialogRef.value?.close();
      }
    }
  }

  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _onSelect(q: QuestionConfig): void {
    this.dispatchEvent(
      new CustomEvent<QuestionConfig>('question-attach', {
        detail: q,
        bubbles: true,
        composed: true,
      }),
    );
    this._close();
  }

  private async _loadItems(): Promise<void> {
    try {
      this._items = (await getCatalogService().listQuestions.execute()) as QuestionConfig[];
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    } finally {
      this._loading = false;
    }
  }

  private _close(): void {
    this._dialogRef.value?.close();
  }

  private _onNativeClose(): void {
    this.dispatchEvent(new CustomEvent('picker-close', { bubbles: true, composed: true }));
  }

  private _renderItems(questions: QuestionConfig[]): TemplateResult | TemplateResult[] {
    if (this._loading) return html`<p class="qpicker-empty">Loading questions...</p>`;
    if (this._error) {
      return html`<p class="qpicker-empty" role="alert">
        Unable to load questions: ${this._error}
      </p>`;
    }
    if (questions.length === 0) return html`<p class="qpicker-empty">No questions found.</p>`;
    return questions.map(
      (q) => html`
        <button class="qpicker-item" @click=${() => this._onSelect(q)}>
          <span class="qpicker-item-icon">${TYPE_ICONS[q.type] ?? '?'}</span>
          <span class="qpicker-item-body">
            <span class="qpicker-item-title">${q.title}</span>
            ${q.description
              ? html`<span class="qpicker-item-desc">${q.description}</span>`
              : nothing}
          </span>
          <span class="qpicker-item-type">${q.type}</span>
        </button>
      `,
    );
  }

  override render(): TemplateResult {
    const term = this._filter.toLowerCase();
    const questions = this._items.filter((q) => !term || q.title.toLowerCase().includes(term));

    return html`
      <dialog
        class="qpicker-modal"
        aria-labelledby="qpicker-title"
        @close=${this._onNativeClose}
        ${ref(this._dialogRef)}
      >
        <div class="qpicker-header">
          <span id="qpicker-title" class="qpicker-title">Add from library</span>
          <button class="qpicker-close" @click=${this._close} aria-label="Close">✕</button>
        </div>

        <div class="qpicker-search">
          <input
            class="qpicker-input"
            type="search"
            aria-label="Search questions"
            placeholder="Search questions…"
            .value=${this._filter}
            @input=${(e: Event) => {
              this._filter = (e.target as HTMLInputElement).value;
            }}
          />
        </div>

        <div class="qpicker-list">${this._renderItems(questions)}</div>
      </dialog>
    `;
  }
}

if (!customElements.get('question-picker')) {
  customElements.define('question-picker', QuestionPicker);
}
