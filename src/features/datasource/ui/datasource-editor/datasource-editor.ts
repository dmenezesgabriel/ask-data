import '../datasource-editor-header/datasource-editor-header';
import '../datasource-editor-panel/datasource-editor-panel';

import { html, LitElement, type TemplateResult } from 'lit';

import type { QueryPort } from '@/core/application/ports';
import type { Datasource as DataSourceConfig } from '@/core/entities';
import { getCatalogService } from '@/shared/services/catalog-service';

import { createEmptyDatasourceConfig } from '../../model/datasource-config';
import { serializeDatasourceYaml } from '../../model/datasource-yaml';

export class DatasourceEditor extends LitElement {
  static override readonly properties = {
    slug: { type: String },
    isNew: { type: Boolean },
    _config: { state: true },
    _isDirty: { state: true },
    _nameError: { state: true },
    _urlError: { state: true },
    _loadError: { state: true },
    queryPort: { attribute: false },
    queryAdapterName: { type: String },
  };

  slug = '';
  isNew = false;
  queryPort: QueryPort | null = null;
  queryAdapterName = 'unconfigured';

  private _config: DataSourceConfig | null = null;
  private _isDirty = false;
  private _nameError = '';
  private _urlError = '';
  private _loadError = '';

  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadConfig();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('slug') || changed.has('isNew')) {
      this._loadConfig();
    }
  }

  private async _loadConfig(): Promise<void> {
    this._loadError = '';
    if (this.isNew && this.slug && this.slug !== 'new') {
      // Shell pre-created the entry; load it so the name appears pre-filled.
      this._config =
        ((await getCatalogService().getDatasource.execute(this.slug)) as DataSourceConfig | null) ??
        createEmptyDatasourceConfig();
    } else if (this.isNew) {
      this._config = createEmptyDatasourceConfig();
    } else {
      this._config = (await getCatalogService().getDatasource.execute(
        this.slug,
      )) as DataSourceConfig | null;
    }
    this._isDirty = false;
    this._nameError = '';
    this._urlError = '';
  }

  private _onPanelChange(e: CustomEvent<DataSourceConfig>): void {
    this._config = e.detail;
    this._isDirty = true;
    if (e.detail.name) this._nameError = '';
    if (e.detail.url) this._urlError = '';
  }

  private _validate(): boolean {
    let valid = true;
    if (!this._config?.name?.trim()) {
      this._nameError = 'Name is required.';
      valid = false;
    }
    if (!this._config?.url?.trim()) {
      this._urlError = 'URL is required.';
      valid = false;
    }
    return valid;
  }

  private async _onSave(): Promise<void> {
    if (!this._config) return;
    if (!this._validate()) return;
    try {
      if (this.isNew && (!this.slug || this.slug === 'new')) {
        const saved = (await getCatalogService().createDatasource!.execute({
          name: this._config.name,
          type: this._config.type,
          url: this._config.url,
          description: this._config.description,
        })) as DataSourceConfig;
        window.location.hash = `#/datasource/${saved.slug}`;
      } else {
        await getCatalogService().updateDatasource!.execute(this.slug, this._config);
        if (this.isNew) window.location.hash = `#/datasource/${this.slug}`;
      }
      this._isDirty = false;
    } catch (error) {
      this._loadError = error instanceof Error ? error.message : String(error);
    }
  }

  private async _onDelete(): Promise<void> {
    if (!this._config || this.isNew) return;
    if (this._config.source === 'yaml') return;
    if (!confirm(`Delete "${this._config.name}"? This cannot be undone.`)) return;
    try {
      await getCatalogService().deleteDatasource!.execute(this._config.id);
      window.location.hash = '#/datasources';
    } catch (error) {
      this._loadError = error instanceof Error ? error.message : String(error);
    }
  }

  private _onExport(): void {
    if (!this._config) return;
    const yaml = serializeDatasourceYaml(this._config);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this._config.slug}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  override render(): TemplateResult {
    if (!this._config) {
      return html`<div class="qe-not-found">Datasource not found: ${this.slug}</div>`;
    }

    return html`
      ${this._loadError ? html`<div class="warning" role="alert">${this._loadError}</div>` : ''}
      <datasource-editor-header
        .title=${this._config.name}
        .isNew=${this.isNew}
        .isDirty=${this._isDirty}
        .isYaml=${this._config.source === 'yaml'}
        @datasource-save=${this._onSave}
        @datasource-delete=${this._onDelete}
        @datasource-export=${this._onExport}
      ></datasource-editor-header>

      <main class="qe-main">
        <datasource-editor-panel
          .config=${this._config}
          .readonly=${this._config.source === 'yaml'}
          .nameError=${this._nameError}
          .urlError=${this._urlError}
          .queryPort=${this.queryPort}
          .queryAdapterName=${this.queryAdapterName}
          @panel-change=${(e: CustomEvent<DataSourceConfig>) => this._onPanelChange(e)}
        ></datasource-editor-panel>
      </main>
    `;
  }
}

if (!customElements.get('datasource-editor')) {
  customElements.define('datasource-editor', DatasourceEditor);
}
