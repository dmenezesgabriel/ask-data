import '../../../ask/ui/ask-clarification';
import '../../../ask/ui/ask-input';
import '../../../ask/ui/ask-result';
import '../dashboard-editor-header';
import '../widget-editor';
import '../dashboard-workspace';

import { html, LitElement, nothing, type TemplateResult } from 'lit';

import type { AskEngineFactory, DataSourceManager, QueryPort } from '@/core/application/ports';
import type { CapabilitySnapshot } from '@/core/platform';
import { createLogger } from '@/shared/observability/logger';

import type {
  AskDataResponse,
  AskSuccessResult,
  Clarification,
  ClarificationChoice,
  DashboardConfig,
} from '../../../../shared/types/index';
import type { AskOrchestrator } from '../../../ask/orchestration/ask-orchestrator';
import { createDashboardOrchestrator } from '../../../ask/orchestration/create-dashboard-orchestrator';
import type { DashboardMode } from '../dashboard-editor-header/dashboard-editor-header';

const logger = createLogger('dashboard.editor');

function isAskSuccess(result: AskDataResponse): result is AskSuccessResult {
  return 'rows' in result && 'sql' in result && 'chartType' in result;
}

export class DashboardEditor extends LitElement {
  static override readonly properties = {
    config: { type: Object },
    slug: { type: String },
    isNew: { type: Boolean },
    _activeTab: { state: true },
    _editMode: { state: true },
    _askQuestion: { state: true },
    _askResult: { state: true },
    _askLoading: { state: true },
    _askError: { state: true },
    _askClarification: { state: true },
    queryPort: { attribute: false },
    queryAdapterName: { type: String },
    dataSourceManager: { attribute: false },
    createAskEngine: { attribute: false },
    capabilitySnapshot: { attribute: false },
  };

  config: DashboardConfig | null = null;
  slug = '';
  isNew = false;
  queryPort: QueryPort | null = null;
  queryAdapterName = 'unconfigured';
  dataSourceManager: DataSourceManager | null = null;
  createAskEngine: AskEngineFactory | null = null;
  capabilitySnapshot: CapabilitySnapshot | null = null;

  private _activeTab: DashboardMode = 'dashboard';
  private _editMode = false;
  private _askQuestion = '';
  private _askResult: AskSuccessResult | null = null;
  private _askLoading = false;
  private _askError = '';
  private _askClarification: Clarification | null = null;
  private _orchestrator: AskOrchestrator | null = null;

  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _getOrchestrator(): AskOrchestrator | null {
    if (!this.config) return null;
    if (!this.dataSourceManager) throw new Error('Dashboard datasource manager is not configured.');
    if (!this.createAskEngine) throw new Error('Dashboard Ask Data engine is not configured.');
    if (!this._orchestrator) {
      this._orchestrator = createDashboardOrchestrator(
        this.config,
        this.dataSourceManager,
        this.createAskEngine,
      );
    }
    return this._orchestrator;
  }

  private async _ensureDataReady(): Promise<void> {
    const orchestrator = this._getOrchestrator();
    if (!orchestrator) return;
    await orchestrator.initialize();
  }

  private async _runAsk(
    appliedClarification: Clarification['pending'] | null = null,
  ): Promise<void> {
    await this._ensureDataReady();
    const orchestrator = this._getOrchestrator();
    if (!orchestrator) return;
    this._askLoading = true;
    this._askError = '';
    this._askClarification = null;
    this._askResult = null;
    try {
      const result = await orchestrator.ask(
        this._askQuestion,
        appliedClarification ? { clarification: appliedClarification } : undefined,
      );
      if ('clarification' in result) this._askClarification = result.clarification;
      else if ('error' in result) this._askError = result.error;
      else if (isAskSuccess(result)) this._askResult = result;
    } catch (err: unknown) {
      logger.error('ask.execute.error', err, {
        operation: 'dashboard-ask-data',
        adapter: this.queryAdapterName,
      });
      this._askError = String(err);
    } finally {
      this._askLoading = false;
    }
  }

  private _chooseClarification(choice: ClarificationChoice): void {
    const pending = this._askClarification?.pending;
    if (!pending) return;
    this._askQuestion = pending.originalQuestion || this._askQuestion;
    this._runAsk({
      ...pending,
      fieldId: choice.fieldId,
      value: choice.value,
      valueNormalized: choice.valueNormalized,
    }).catch(console.error);
  }

  private _renderAskData(): TemplateResult {
    const c = this.config;
    if (!c) return html``;
    return html`
      <main class="ask-page">
        <ask-input
          .question=${this._askQuestion}
          .examples=${c.askData.examples || []}
          .loading=${this._askLoading}
          @question-change=${(e: CustomEvent<string>) => {
            this._askQuestion = e.detail;
          }}
          @ask=${() => {
            this._runAsk().catch(console.error);
          }}
          @example-select=${(e: CustomEvent<string>) => {
            this._askQuestion = e.detail;
            this._askError = '';
            this._askClarification = null;
            this._askResult = null;
            this.updateComplete.then(() => {
              const input = this.querySelector<HTMLInputElement>('.ask-input-row input');
              input?.focus();
              input?.classList.add('input-prefilled');
              setTimeout(() => input?.classList.remove('input-prefilled'), 800);
            });
          }}
        ></ask-input>

        ${this._askError
          ? html`<div class="warning" role="alert">${this._askError}</div>`
          : nothing}

        <ask-clarification
          .clarification=${this._askClarification}
          @choice-select=${(e: CustomEvent<ClarificationChoice>) =>
            this._chooseClarification(e.detail)}
        ></ask-clarification>

        <ask-result .result=${this._askResult}></ask-result>
      </main>
    `;
  }

  private _renderTabContent(): TemplateResult {
    return html`
      <div
        id="panel-dashboard"
        role="tabpanel"
        aria-labelledby="tab-dashboard"
        tabindex="0"
        ?hidden=${this._activeTab !== 'dashboard'}
      >
        <dashboard-workspace
          .config=${this.config}
          .isNew=${this.isNew}
          .slug=${this.slug}
          .editMode=${this._editMode}
          .queryPort=${this.queryPort}
          .queryAdapterName=${this.queryAdapterName}
          .dataSourceManager=${this.dataSourceManager}
          .createAskEngine=${this.createAskEngine}
          .capabilitySnapshot=${this.capabilitySnapshot}
        ></dashboard-workspace>
      </div>
      <div
        id="panel-ask-data"
        role="tabpanel"
        aria-labelledby="tab-ask-data"
        tabindex="0"
        ?hidden=${this._activeTab !== 'askData'}
      >
        ${this._renderAskData()}
      </div>
    `;
  }

  override render(): TemplateResult {
    const c = this.config;
    return html`
      <top-nav></top-nav>

      <dashboard-editor-header
        .title=${c?.title ?? ''}
        .subtitle=${c?.subtitle ?? ''}
        .mode=${this._activeTab}
        .editMode=${this._editMode}
        @mode-change=${(e: CustomEvent<DashboardMode>) => {
          this._activeTab = e.detail;
        }}
        @edit-mode-toggle=${(e: CustomEvent<{ editMode: boolean }>) => {
          this._editMode = e.detail.editMode;
        }}
      ></dashboard-editor-header>

      ${this._renderTabContent()}
    `;
  }
}

if (!customElements.get('dashboard-editor')) {
  customElements.define('dashboard-editor', DashboardEditor);
}
