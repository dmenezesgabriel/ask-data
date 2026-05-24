import { html, type TemplateResult } from 'lit';
import { LayoutGrid } from 'lucide';

import type { Dashboard } from '@/core/entities';
import { getCatalogService } from '@/shared/services/catalog-service';

import { CollectionList } from '../../../../shared/ui/collection-list/collection-list';
import { icon } from '../../../../shared/utils/icons';
import { dashboardEntityToEntry, type DashboardEntry } from '../../model/dashboard-entity-mapper';
import { getPersistedWidgetCount } from '../dashboard-workspace/dashboard-workspace-model';

export class DashboardList extends CollectionList {
  static override readonly properties = {
    ...CollectionList.properties,
    _items: { state: true },
    _loading: { state: true },
    _error: { state: true },
  };

  private _items: DashboardEntry[] = [];
  private _loading = true;
  private _error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadItems();
  }

  public override get title(): string {
    return 'Dashboards';
  }

  protected override get subtitle(): string {
    return 'Your Data, Any Data, Instantly Explained';
  }

  protected override get createDialogTitle(): string {
    return 'Create New Dashboard';
  }

  protected override get createNameLabel(): string {
    return 'Name';
  }

  protected override get createNamePlaceholder(): string {
    return 'Enter dashboard name';
  }

  protected override get createButtonLabel(): string {
    return 'New Dashboard';
  }

  protected override get itemCount(): number {
    return this._items.length;
  }

  protected override get itemCountLabel(): string {
    return 'dashboard';
  }

  protected override _titleIcon(): TemplateResult {
    return icon(LayoutGrid, { size: 32 });
  }

  protected override _handleCreate(): void {
    this.dispatchEvent(
      new CustomEvent('dashboard-create', {
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
      this._items = ((await getCatalogService().listDashboards.execute()) as Dashboard[]).map(
        dashboardEntityToEntry,
      );
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    } finally {
      this._loading = false;
    }
  }

  private _onSelect(slug: string): void {
    this.dispatchEvent(
      new CustomEvent('dashboard-select', { detail: { slug }, bubbles: true, composed: true }),
    );
  }

  private _onDelete(entry: DashboardEntry): void {
    if (!confirm(`Delete "${entry.config.title}"? This cannot be undone.`)) return;
    getCatalogService()
      .deleteDashboard!.execute(entry.slug)
      .then(() => this._loadItems())
      .catch((error: unknown) => {
        this._error = error instanceof Error ? error.message : String(error);
      });
    this.dispatchEvent(
      new CustomEvent('dashboard-delete', {
        detail: { slug: entry.slug },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _renderWidgetCount(entry: DashboardEntry): TemplateResult {
    const persisted = getPersistedWidgetCount(entry.slug);
    if (persisted !== null) {
      return html`<span>${persisted}</span> widgets`;
    }
    const total =
      entry.config.kpis.length + entry.config.charts.length + entry.config.tables.length;
    return html`<span>${total}</span> widgets`;
  }

  protected override _renderListItems(): TemplateResult {
    if (this._loading) {
      return html`<div class="collection-list-empty"><p>Loading dashboards...</p></div>`;
    }
    if (this._error) {
      return html`<div class="collection-list-empty" role="alert">
        <p>Unable to load dashboards: ${this._error}</p>
      </div>`;
    }
    if (this._items.length === 0) {
      return html`
        <div class="collection-list-empty">
          <p>No dashboards yet. Create your first dashboard to get started.</p>
        </div>
      `;
    }
    return html`
      <div class="collection-list-table">
        <div class="collection-list-header">
          <span class="collection-list-col collection-list-col-name">Name</span>
          <span class="collection-list-col collection-list-col-desc">Description</span>
          <span class="collection-list-col collection-list-col-meta">Widgets</span>
          <span class="collection-list-col collection-list-col-actions"></span>
        </div>
        ${this._items.map(
          (entry: DashboardEntry) => html`
            <div
              class="collection-list-row"
              role="button"
              tabindex="0"
              @click=${() => this._onSelect(entry.slug)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this._onSelect(entry.slug);
              }}
            >
              <span class="collection-list-col collection-list-col-name">
                <span class="collection-list-row-icon">${icon(LayoutGrid, { size: 16 })}</span>
                <span class="collection-list-row-title">${entry.config.title}</span>
              </span>
              <span class="collection-list-col collection-list-col-desc"
                >${entry.config.subtitle}</span
              >
              <span class="collection-list-col collection-list-col-meta">
                ${this._renderWidgetCount(entry)}
              </span>
              <span
                class="collection-list-col collection-list-col-actions"
                @click=${(e: Event) => e.stopPropagation()}
              >
                ${this._renderRowActions(
                  () => this._onSelect(entry.slug),
                  () => this._onSelect(entry.slug),
                  entry.source !== 'yaml' ? () => this._onDelete(entry) : null,
                )}
              </span>
            </div>
          `,
        )}
      </div>
    `;
  }
}

if (!customElements.get('dashboard-list')) {
  customElements.define('dashboard-list', DashboardList);
}
