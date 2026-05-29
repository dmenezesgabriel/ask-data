import '../../../dashboard/ui/widget';
import '../../../../shared/ui/code-editor';
import '../../../datasource/ui/datasource-picker/datasource-picker';
import '../../../../shared/ui/ui-button';

import { html, LitElement, nothing, type TemplateResult } from 'lit';

import type { AskEngineFactory, DataSourceManager, QueryPort } from '@/core/application/ports';
import type {
  DashboardWidget as WidgetConfig,
  Datasource as DataSourceConfig,
  Question as QuestionConfig,
} from '@/core/entities';
import type { CapabilitySnapshot } from '@/core/platform';
import { createLogger } from '@/shared/observability/logger';
import { getCatalogService } from '@/shared/services/catalog-service';

import type { CellValue } from '../../../../shared/types/index';
import { SQL } from '../../../../shared/ui/code-editor';
import { toRows } from '../../../../shared/utils/utils';

const WIDGET_TYPES = ['chart', 'table', 'kpi', 'text'] as const;
const logger = createLogger('question.editor-panel');
const CHART_TYPES = [
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'scatter',
  'bubble',
  'histogram',
] as const;

export class QuestionEditorPanel extends LitElement {
  static override readonly properties = {
    config: { type: Object },
    readonly: { type: Boolean },
    titleError: { type: String },
    _previewData: { state: true },
    _previewError: { state: true },
    _previewLoading: { state: true },
    _pickerOpen: { state: true },
    _datasources: { state: true },
    queryPort: { attribute: false },
    queryAdapterName: { type: String },
    dataSourceManager: { attribute: false },
    createAskEngine: { attribute: false },
    capabilitySnapshot: { attribute: false },
  };

  config: QuestionConfig | null = null;
  readonly = false;
  titleError = '';
  queryPort: QueryPort | null = null;
  queryAdapterName = 'unconfigured';
  dataSourceManager: DataSourceManager | null = null;
  createAskEngine: AskEngineFactory | null = null;
  capabilitySnapshot: CapabilitySnapshot | null = null;

  private _previewData: {
    labels: string[];
    values: number[];
    rows?: Record<string, unknown>[];
  } | null = null;
  private _previewError = '';
  private _previewLoading = false;
  private _pickerOpen = false;
  private _datasources: DataSourceConfig[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadDatasources();
  }

  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _emit(changes: Partial<QuestionConfig>): void {
    if (!this.config) return;
    const updated: QuestionConfig = {
      ...this.config,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    this.dispatchEvent(
      new CustomEvent<QuestionConfig>('panel-change', {
        detail: updated,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get _resolvedDataSources(): DataSourceConfig[] {
    const slugs = this.config?.dataSourceSlugs ?? [];
    return slugs
      .map((slug) => this._datasources.find((datasource) => datasource.slug === slug))
      .filter(Boolean) as DataSourceConfig[];
  }

  private get _missingDatasourceSlugs(): string[] {
    const slugs = this.config?.dataSourceSlugs ?? [];
    return slugs.filter(
      (slug) => !this._datasources.some((datasource) => datasource.slug === slug),
    );
  }

  private async _loadDatasources(): Promise<void> {
    try {
      this._datasources =
        (await getCatalogService().listDatasources.execute()) as DataSourceConfig[];
    } catch {
      this._datasources = [];
    }
  }

  private _availableChartTypes(): readonly (typeof CHART_TYPES)[number][] {
    if (!this.capabilitySnapshot) return CHART_TYPES;
    const available = this.capabilitySnapshot.capabilities
      .filter((capability) => capability.contributionType === 'widget-renderer')
      .map((capability) => capability.id.replace('visualization.chart.', ''));

    return CHART_TYPES.filter((chartType) => available.includes(chartType));
  }

  private async _runNaturalLanguagePreview(
    query: string,
    sources: DataSourceConfig[],
  ): Promise<void> {
    if (!this.createAskEngine) throw new Error('Question Ask Data engine is not configured.');
    const engine = this.createAskEngine({ dataSources: sources });
    await engine.initialize();
    const result = await engine.ask(query, {});
    if (!('rows' in result) || !('sql' in result) || !result.rows.length) {
      this._previewError = 'Natural language query returned no results.';
      return;
    }

    this._emit({ query: result.sql });
    const rows = result.rows.map((r: Record<string, CellValue>) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]),
      ),
    );
    const labels = rows.map((r) => String(r['label'] ?? r['name'] ?? Object.values(r)[0] ?? ''));
    const values = rows.map((r) =>
      Number(r['value'] ?? Object.values(r).find((v) => typeof v === 'number') ?? 0),
    );
    this._previewData = { labels, values, rows };
  }

  private async _runSqlPreview(query: string): Promise<void> {
    if (!this.queryPort) throw new Error('Question query port is not configured.');
    const rawRows = toRows(await this.queryPort.query(query));
    const rows = rawRows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]),
      ),
    );
    if (!rows.length) {
      logger.warn('query.zeroRows', { query });
      this._previewData = { labels: [], values: [], rows: [] };
      return;
    }
    const labels = rows.map((r) => String(r['label'] ?? r[Object.keys(r)[0] ?? ''] ?? ''));
    const values = rows.map((r) => Number(r['value'] ?? r[Object.keys(r)[1] ?? ''] ?? 0));
    this._previewData = { labels, values, rows };
  }

  async runPreview(): Promise<void> {
    const isNl = this.config?.queryType === 'nl';
    const query = isNl ? (this.config?.nlQuery ?? this.config?.query) : this.config?.query;
    const sources = this._resolvedDataSources;
    if (!query) return;
    if (!sources.length) {
      this._previewData = null;
      this._previewError = 'Link at least one datasource to run a preview.';
      return;
    }

    this._previewLoading = true;
    this._previewError = '';
    this._previewData = null;
    try {
      if (!this.dataSourceManager)
        throw new Error('Question datasource manager is not configured.');
      await this.dataSourceManager.createViews(sources);
      await (isNl ? this._runNaturalLanguagePreview(query, sources) : this._runSqlPreview(query));
    } catch (err: unknown) {
      logger.error('query.execute.error', err, {
        operation: isNl ? 'question-preview-ask' : 'question-preview-sql',
        adapter: this.queryAdapterName,
      });
      this._previewError = String(err);
    } finally {
      this._previewLoading = false;
    }
  }

  private _renderTypeSection(): TemplateResult {
    const q = this.config!;
    return html`
      <section class="qep-section">
        <label class="qep-label">Visualisation type</label>
        <div class="qep-type-grid">
          ${WIDGET_TYPES.map(
            (t) => html`
              <button
                class="qep-type-btn ${q.type === t ? 'active' : ''}"
                ?disabled=${this.readonly}
                @click=${() => this._emit({ type: t })}
              >
                ${t}
              </button>
            `,
          )}
        </div>
        ${q.type === 'chart'
          ? html`
              <label class="qep-label qep-label-sm">Chart type</label>
              <select
                class="qep-select"
                .value=${q.chartType ?? 'bar'}
                ?disabled=${this.readonly}
                @change=${(e: Event) =>
                  this._emit({
                    chartType: (e.target as HTMLSelectElement).value as QuestionConfig['chartType'],
                  })}
              >
                ${this._availableChartTypes().map(
                  (ct) => html`<option value=${ct} ?selected=${q.chartType === ct}>${ct}</option>`,
                )}
              </select>
            `
          : nothing}
      </section>
    `;
  }

  private _renderQuerySection(): TemplateResult {
    const q = this.config!;
    return html`
      <section class="qep-section">
        <div class="qep-query-header">
          <label class="qep-label">Query</label>
          <div class="qep-query-type-toggle">
            <button
              class="qep-toggle-btn ${q.queryType !== 'nl' ? 'active' : ''}"
              ?disabled=${this.readonly}
              @click=${() => this._emit({ queryType: 'sql' })}
            >
              SQL
            </button>
            <button
              class="qep-toggle-btn ${q.queryType === 'nl' ? 'active' : ''}"
              ?disabled=${this.readonly}
              @click=${() => this._emit({ queryType: 'nl' })}
            >
              Natural language
            </button>
          </div>
        </div>
        ${q.queryType === 'nl'
          ? html`<textarea
              class="qep-query-input"
              rows="5"
              placeholder="e.g. sales by region"
              .value=${q.nlQuery ?? ''}
              ?disabled=${this.readonly}
              @input=${(e: Event) =>
                this._emit({ nlQuery: (e.target as HTMLTextAreaElement).value })}
            ></textarea>`
          : html`<ui-code-editor
              .language=${SQL}
              .value=${q.query ?? ''}
              ?readonly=${this.readonly}
              placeholder="SELECT ..."
              @value-change=${(e: CustomEvent<string>) => this._emit({ query: e.detail })}
            ></ui-code-editor>`}
        <button class="qep-run-btn" @click=${() => this.runPreview()}>Run preview</button>
      </section>
    `;
  }

  private _renderDataSourcesSection(): TemplateResult {
    const slugs = this.config?.dataSourceSlugs ?? [];
    const resolved = this._resolvedDataSources;
    const missing = this._missingDatasourceSlugs;

    return html`
      <section class="qep-section">
        <label class="qep-label">Linked datasources</label>
        ${slugs.length === 0
          ? html`<p class="qep-ds-empty">No datasources linked. Link one to run a preview.</p>`
          : html`
              <ul class="qep-ds-linked-list">
                ${resolved.map(
                  (ds) => html`
                    <li class="qep-ds-linked-item">
                      <span class="qep-ds-type-tag">${ds.type.toUpperCase()}</span>
                      <span class="qep-ds-name">${ds.name}</span>
                      <button
                        class="qep-ds-remove"
                        aria-label="Remove ${ds.name}"
                        title="Remove ${ds.name}"
                        @click=${() =>
                          this._emit({
                            dataSourceSlugs: slugs.filter((s) => s !== ds.slug),
                          })}
                      >
                        ✕
                      </button>
                    </li>
                  `,
                )}
                ${missing.map(
                  (s) => html`
                    <li class="qep-ds-linked-item qep-ds-missing">
                      <span class="qep-ds-warn">⚠ "${s}" not found</span>
                    </li>
                  `,
                )}
              </ul>
            `}

        <div class="qep-ds-actions">
          <ui-button
            .variant=${'secondary'}
            .size=${'sm'}
            .content=${'Manage datasources'}
            ?disabled=${this.readonly}
            @click=${() => (this._pickerOpen = true)}
          ></ui-button>
          <a class="qep-ds-create-link" href="#/datasource/new" target="_self">
            + Create new datasource
          </a>
        </div>

        <datasource-picker
          .open=${this._pickerOpen}
          .selectedSlugs=${slugs}
          @datasources-selected=${(e: CustomEvent<string[]>) => {
            this._emit({ dataSourceSlugs: e.detail });
            this._pickerOpen = false;
          }}
          @picker-close=${() => (this._pickerOpen = false)}
        ></datasource-picker>
      </section>
    `;
  }

  private _renderPreview(): TemplateResult {
    if (!this.config) return html``;

    const sources = this._resolvedDataSources;
    if (!sources.length && !this._previewError) {
      return html`
        <div class="qep-preview-placeholder">Link a datasource to enable live preview</div>
      `;
    }

    if (this._previewLoading) {
      return html`<div class="qep-preview-loading">Running query…</div>`;
    }

    if (this._previewError) {
      return html`<div class="qep-preview-error">${this._previewError}</div>`;
    }

    if (!this._previewData) {
      return html`<div class="qep-preview-placeholder">Click "Run preview" to see results</div>`;
    }

    const widgetConfig: WidgetConfig = {
      id: 'preview',
      type: this.config.type,
      title: this.config.title,
      chartType: this.config.chartType,
      columns: this.config.columns,
      columnFormats: this.config.columnFormats as Record<string, 'currency'> | undefined,
      options: this.config.options,
    };

    return html`
      <app-widget
        .config=${widgetConfig}
        .data=${this._previewData}
        .editMode=${false}
      ></app-widget>
    `;
  }

  override render(): TemplateResult {
    if (!this.config) return html``;

    return html`
      <div class="qep-layout">
        <div class="qep-form">
          <section class="qep-section">
            <label class="qep-label" for="qep-title">Title</label>
            <input
              id="qep-title"
              class="qep-input"
              type="text"
              .value=${this.config.title}
              ?disabled=${this.readonly}
              ?aria-invalid=${!!this.titleError}
              @input=${(e: Event) => this._emit({ title: (e.target as HTMLInputElement).value })}
            />
            ${this.titleError
              ? html`<div role="alert" class="qep-field-error">${this.titleError}</div>`
              : nothing}
            <label class="qep-label qep-label-sm" for="qep-desc">Description (optional)</label>
            <input
              id="qep-desc"
              class="qep-input"
              type="text"
              placeholder="Short description"
              .value=${this.config.description ?? ''}
              ?disabled=${this.readonly}
              @input=${(e: Event) =>
                this._emit({ description: (e.target as HTMLInputElement).value || undefined })}
            />
          </section>

          ${this._renderTypeSection()} ${this._renderQuerySection()}
          ${this._renderDataSourcesSection()}
        </div>

        <div class="qep-preview">
          <span class="qep-preview-label">Preview</span>
          ${this._renderPreview()}
        </div>
      </div>
    `;
  }
}

if (!customElements.get('question-editor-panel')) {
  customElements.define('question-editor-panel', QuestionEditorPanel);
}
