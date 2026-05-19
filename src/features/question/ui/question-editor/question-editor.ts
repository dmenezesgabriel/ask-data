import './question-editor-header';
import '../question-editor-panel';

import { html, LitElement, type TemplateResult } from 'lit';

import type { Question as QuestionConfig } from '@/core/entities';

import { createEmptyQuestionConfig } from '../../model/question-config';
import {
  addQuestion,
  deleteQuestion,
  getQuestionBySlug,
  updateQuestion,
} from '../../question-service';

export class QuestionEditor extends LitElement {
  static override readonly properties = {
    slug: { type: String },
    isNew: { type: Boolean },
    _config: { state: true },
    _isDirty: { state: true },
  };

  slug = '';
  isNew = false;

  private _config: QuestionConfig | null = null;
  private _isDirty = false;

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

  private _loadConfig(): void {
    if (this.isNew && this.slug && this.slug !== 'new') {
      // Shell pre-created the entry; load it so the title appears pre-filled.
      this._config = getQuestionBySlug(this.slug) ?? createEmptyQuestionConfig();
    } else if (this.isNew) {
      this._config = createEmptyQuestionConfig();
    } else {
      this._config = getQuestionBySlug(this.slug) ?? null;
    }
    this._isDirty = false;
  }

  private _onPanelChange(e: CustomEvent<QuestionConfig>): void {
    this._config = e.detail;
    this._isDirty = true;
  }

  private _onSave(): void {
    if (!this._config) return;
    if (this.isNew) {
      if (this.slug && this.slug !== 'new' && getQuestionBySlug(this.slug)) {
        updateQuestion(this.slug, this._config);
        window.location.hash = `#/question/${this.slug}`;
      } else {
        const saved = addQuestion(this._config);
        window.location.hash = `#/question/${saved.slug}`;
      }
    } else {
      updateQuestion(this.slug, this._config);
    }
    this._isDirty = false;
  }

  private _onDelete(): void {
    if (!this._config || this.isNew) return;
    if (this._config.source === 'yaml') return;
    if (!confirm(`Delete "${this._config.title}"? This cannot be undone.`)) return;
    deleteQuestion(this.slug);
    window.location.hash = '#/questions';
  }

  override render(): TemplateResult {
    if (!this._config) {
      return html`<div class="qe-not-found">Question not found: ${this.slug}</div>`;
    }

    return html`
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
          @panel-change=${(e: CustomEvent<QuestionConfig>) => this._onPanelChange(e)}
        ></question-editor-panel>
      </main>
    `;
  }
}

if (!customElements.get('question-editor')) {
  customElements.define('question-editor', QuestionEditor);
}
