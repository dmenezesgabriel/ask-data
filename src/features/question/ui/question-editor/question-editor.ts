import './question-editor-header';
import '../question-editor-panel';

import { html, LitElement, type TemplateResult } from 'lit';

import type { AskEngineFactory, DataSourceManager, QueryPort } from '@/core/application/ports';
import type { Question as QuestionConfig } from '@/core/entities';
import { getCatalogService } from '@/shared/services/catalog-service';

import { createEmptyQuestionConfig } from '../../model/question-config';

export class QuestionEditor extends LitElement {
  static override readonly properties = {
    slug: { type: String },
    isNew: { type: Boolean },
    _config: { state: true },
    _isDirty: { state: true },
    _error: { state: true },
    queryPort: { attribute: false },
    queryAdapterName: { type: String },
    dataSourceManager: { attribute: false },
    createAskEngine: { attribute: false },
  };

  slug = '';
  isNew = false;
  queryPort: QueryPort | null = null;
  queryAdapterName = 'unconfigured';
  dataSourceManager: DataSourceManager | null = null;
  createAskEngine: AskEngineFactory | null = null;

  private _config: QuestionConfig | null = null;
  private _isDirty = false;
  private _error = '';

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
    this._error = '';
    if (this.isNew && this.slug && this.slug !== 'new') {
      // Shell pre-created the entry; load it so the title appears pre-filled.
      this._config =
        ((await getCatalogService().getQuestion.execute(this.slug)) as QuestionConfig | null) ??
        createEmptyQuestionConfig();
    } else if (this.isNew) {
      this._config = createEmptyQuestionConfig();
    } else {
      this._config = (await getCatalogService().getQuestion.execute(
        this.slug,
      )) as QuestionConfig | null;
    }
    this._isDirty = false;
  }

  private _onPanelChange(e: CustomEvent<QuestionConfig>): void {
    this._config = e.detail;
    this._isDirty = true;
  }

  private async _onSave(): Promise<void> {
    if (!this._config) return;
    try {
      if (this.isNew) {
        if (
          this.slug &&
          this.slug !== 'new' &&
          (await getCatalogService().getQuestion.execute(this.slug))
        ) {
          await getCatalogService().updateQuestion!.execute(this.slug, this._config);
          window.location.hash = `#/question/${this.slug}`;
        } else {
          const saved = (await getCatalogService().createQuestion!.execute(
            this._config,
          )) as QuestionConfig;
          window.location.hash = `#/question/${saved.slug}`;
        }
      } else {
        await getCatalogService().updateQuestion!.execute(this.slug, this._config);
      }
      this._isDirty = false;
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    }
  }

  private async _onDelete(): Promise<void> {
    if (!this._config || this.isNew) return;
    if (this._config.source === 'yaml') return;
    if (!confirm(`Delete "${this._config.title}"? This cannot be undone.`)) return;
    try {
      await getCatalogService().deleteQuestion!.execute(this._config.id);
      window.location.hash = '#/questions';
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    }
  }

  override render(): TemplateResult {
    if (!this._config) {
      return html`<div class="qe-not-found">Question not found: ${this.slug}</div>`;
    }

    return html`
      ${this._error ? html`<div class="warning" role="alert">${this._error}</div>` : ''}
      <question-editor-header
        .title=${this._config.title}
        .isNew=${this.isNew}
        .isDirty=${this._isDirty}
        .isYaml=${this._config.source === 'yaml'}
        @question-save=${this._onSave}
        @question-delete=${this._onDelete}
      ></question-editor-header>

      <main class="qe-main">
        <question-editor-panel
          .config=${this._config}
          .readonly=${this._config.source === 'yaml'}
          .queryPort=${this.queryPort}
          .queryAdapterName=${this.queryAdapterName}
          .dataSourceManager=${this.dataSourceManager}
          .createAskEngine=${this.createAskEngine}
          @panel-change=${(e: CustomEvent<QuestionConfig>) => this._onPanelChange(e)}
        ></question-editor-panel>
      </main>
    `;
  }
}

if (!customElements.get('question-editor')) {
  customElements.define('question-editor', QuestionEditor);
}
