import { html, nothing, type TemplateResult } from 'lit';
import { BarChart2, FileText, HelpCircle, MessageSquare, Table2, TrendingUp } from 'lucide';

import type { Question as QuestionConfig } from '@/core/entities';
import { getCatalogService } from '@/shared/services/catalog-service';

import { CollectionList } from '../../../../shared/ui/collection-list/collection-list';
import { icon } from '../../../../shared/utils/icons';

export class QuestionList extends CollectionList {
  static override readonly properties = {
    ...CollectionList.properties,
    _items: { state: true },
    _loading: { state: true },
    _error: { state: true },
  };

  private _items: QuestionConfig[] = [];
  private _loading = true;
  private _error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadItems();
  }

  public override get title(): string {
    return 'Questions';
  }

  protected override get subtitle(): string {
    return 'Reusable data questions and visualizations';
  }

  protected override get createDialogTitle(): string {
    return 'Create New Question';
  }

  protected override get createNameLabel(): string {
    return 'Name';
  }

  protected override get createNamePlaceholder(): string {
    return 'Enter question name';
  }

  protected override get createButtonLabel(): string {
    return 'New Question';
  }

  protected override get createDisabledReason(): string | null {
    return getCatalogService().createQuestion
      ? null
      : 'Question creation is unavailable in this read-only deployment mode.';
  }

  protected override get itemCount(): number {
    return this._items.length;
  }

  protected override get itemCountLabel(): string {
    return 'question';
  }

  protected override _titleIcon(): TemplateResult {
    return icon(MessageSquare, { size: 32 });
  }

  protected override _handleCreate(): void {
    this.dispatchEvent(
      new CustomEvent('question-create', {
        detail: { name: this._newItemName.trim() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async _loadItems(): Promise<void> {
    this._loading = true;
    this._error = '';
    try {
      this._items = (await getCatalogService().listQuestions.execute()) as QuestionConfig[];
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    } finally {
      this._loading = false;
    }
  }

  private _handleSelect(slug: string): void {
    this.dispatchEvent(
      new CustomEvent('question-select', {
        detail: { slug },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleDelete(q: QuestionConfig): void {
    if (!confirm(`Delete "${q.title}"? This cannot be undone.`)) return;
    getCatalogService()
      .deleteQuestion!.execute(q.id)
      .then(() => this._loadItems())
      .catch((error: unknown) => {
        this._error = error instanceof Error ? error.message : String(error);
      });
    this.dispatchEvent(
      new CustomEvent('question-delete', {
        detail: { slug: q.slug },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _getTypeIcon(type: string): TemplateResult {
    const iconMap: Record<string, Parameters<typeof icon>[0]> = {
      chart: BarChart2,
      table: Table2,
      kpi: TrendingUp,
      text: FileText,
    };
    return icon(iconMap[type] ?? HelpCircle, { size: 16 });
  }

  protected override _renderListItems(): TemplateResult {
    if (this._loading) {
      return html`<div class="collection-list-empty"><p>Loading questions...</p></div>`;
    }
    if (this._error) {
      return html`<div class="collection-list-empty" role="alert">
        <p>Unable to load questions: ${this._error}</p>
      </div>`;
    }
    if (this._items.length === 0) {
      return html`
        <div class="collection-list-empty">
          <p>No questions yet. Create your first question to get started.</p>
        </div>
      `;
    }
    return html`
      <div class="collection-list-table">
        <div class="collection-list-header">
          <span class="collection-list-col collection-list-col-name">Name</span>
          <span class="collection-list-col collection-list-col-desc">Description</span>
          <span class="collection-list-col collection-list-col-meta">Type</span>
          <span class="collection-list-col collection-list-col-actions"></span>
        </div>
        ${this._items.map(
          (q: QuestionConfig) => html`
            <div
              class="collection-list-row"
              role="button"
              tabindex="0"
              @click=${() => this._handleSelect(q.slug)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this._handleSelect(q.slug);
              }}
            >
              <span class="collection-list-col collection-list-col-name">
                <span class="collection-list-row-icon" aria-hidden="true"
                  >${this._getTypeIcon(q.type)}</span
                >
                <span class="collection-list-row-title">${q.title}</span>
              </span>
              <span class="collection-list-col collection-list-col-desc"
                >${q.description ?? nothing}</span
              >
              <span class="collection-list-col collection-list-col-meta">
                ${q.type}${q.source === 'yaml'
                  ? html`<span class="collection-list-sep">·</span> read-only`
                  : nothing}
              </span>
              <span
                class="collection-list-col collection-list-col-actions"
                @click=${(e: Event) => e.stopPropagation()}
              >
                ${this._renderRowActions(
                  () => this._handleSelect(q.slug),
                  getCatalogService().updateQuestion ? () => this._handleSelect(q.slug) : null,
                  q.source !== 'yaml' && getCatalogService().deleteQuestion
                    ? () => this._handleDelete(q)
                    : null,
                )}
              </span>
            </div>
          `,
        )}
      </div>
    `;
  }
}

if (!customElements.get('question-list')) {
  customElements.define('question-list', QuestionList);
}
