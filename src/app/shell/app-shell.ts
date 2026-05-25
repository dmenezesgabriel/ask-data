import '../../features/question/ui/question-editor';
import '../../features/question/ui/question-list';
import '../../features/datasource/ui/datasource-list/datasource-list';
import '../../features/datasource/ui/datasource-editor/datasource-editor';
import '../../components/top-nav';
import '../../shared/ui/ui-button';
import '../../features/dashboard/ui/dashboard-editor';
import '../../features/dashboard/ui/dashboard-list';

import { html, LitElement, type TemplateResult } from 'lit';

import { container } from '../../composition/app-container';
import { createEmptyDashboardConfig } from '../../features/dashboard/model/dashboard-config';
import { dashboardEntityToConfig } from '../../features/dashboard/model/dashboard-entity-mapper';
import type { DashboardConfig } from '../../shared/types';
import { parseHash, type Route, routeToHash } from '../routing/hash-routes';

function slugToTitle(s: string): string {
  if (!s) return 'New Dashboard';
  if (s === 'new') return 'New Dashboard';
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export class AppShell extends LitElement {
  static override readonly properties = {
    _route: { state: true },
    _dashboardConfig: { state: true },
    _dashboardLoadKey: { state: true },
    _dashboardLoadError: { state: true },
  };

  private _route: Route = { view: 'list' };
  private _dashboardConfig: DashboardConfig | null = null;
  private _dashboardLoadKey = '';
  private _dashboardLoadError = '';

  private readonly _hashChangeHandler = (): void => {
    this._route = parseHash(window.location.hash);
    this.requestUpdate();
  };

  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._route = parseHash(window.location.hash);
    window.addEventListener('hashchange', this._hashChangeHandler);
  }

  override disconnectedCallback(): void {
    window.removeEventListener('hashchange', this._hashChangeHandler);
    super.disconnectedCallback();
  }

  private _navigate(route: Route): void {
    window.location.hash = routeToHash(route);
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('_route')) this._loadDashboardForRoute();
  }

  private async _loadDashboardForRoute(): Promise<void> {
    const route = this._route;
    if (route.view !== 'editor') return;
    const key = `${route.slug}:${route.isNew ? 'new' : 'existing'}`;
    if (this._dashboardLoadKey === key) return;
    this._dashboardLoadKey = key;
    this._dashboardLoadError = '';

    if (route.isNew) {
      this._dashboardConfig = createEmptyDashboardConfig(slugToTitle(route.slug));
      return;
    }

    try {
      const dashboard = await container.getDashboard.execute(route.slug);
      this._dashboardConfig = dashboard ? dashboardEntityToConfig(dashboard) : null;
    } catch (error) {
      this._dashboardConfig = null;
      this._dashboardLoadError = error instanceof Error ? error.message : String(error);
    }
  }

  private async _onDashboardCreate(e: CustomEvent<{ name: string }>): Promise<void> {
    if (!container.createDashboard) return;
    try {
      const name = e.detail.name;
      const dashboard = await container.createDashboard.execute({ name });
      this._navigate({ view: 'editor', slug: dashboard.id, isNew: true });
    } catch (err) {
      console.error('[app-shell] Failed to create dashboard:', err);
    }
  }

  private async _onQuestionCreate(e: CustomEvent<{ name: string }>): Promise<void> {
    if (!container.createQuestion) return;
    try {
      const q = await container.createQuestion.execute({
        title: e.detail.name,
        type: 'chart',
        chartType: 'bar',
        queryType: 'sql',
        query: '',
      });
      this._navigate({ view: 'question-editor', slug: q.slug, isNew: true });
    } catch (err) {
      console.error('[app-shell] Failed to create question:', err);
    }
  }

  private async _onDatasourceCreate(e: CustomEvent<{ name: string }>): Promise<void> {
    if (!container.createDatasource) return;
    try {
      const ds = await container.createDatasource.execute({
        name: e.detail.name,
        type: 'csv',
        url: '',
      });
      this._navigate({ view: 'datasource-editor', slug: ds.slug, isNew: true });
    } catch (err) {
      console.error('[app-shell] Failed to create datasource:', err);
    }
  }

  override render(): TemplateResult {
    const r = this._route;

    if (r.view === 'questions') {
      return html`
        <top-nav .activeSection=${'questions'}></top-nav>
        <question-list
          @question-select=${(e: CustomEvent<{ slug: string }>) =>
            this._navigate({ view: 'question-editor', slug: e.detail.slug })}
          @question-create=${(e: CustomEvent<{ name: string }>) => this._onQuestionCreate(e)}
        ></question-list>
      `;
    }

    if (r.view === 'question-editor') {
      return html`
        <top-nav .activeSection=${'questions'}></top-nav>
        <question-editor
          .slug=${r.slug}
          .isNew=${r.isNew ?? false}
          .queryPort=${container.queryPort}
          .queryAdapterName=${container.queryAdapterName}
          .dataSourceManager=${container.dataSourceManager}
          .createAskEngine=${container.createAskEngine}
          .capabilitySnapshot=${container.capabilitySnapshot}
        ></question-editor>
      `;
    }

    if (r.view === 'datasources') {
      return html`
        <top-nav .activeSection=${'datasources'}></top-nav>
        <datasource-list
          @datasource-select=${(e: CustomEvent<{ slug: string }>) =>
            this._navigate({ view: 'datasource-editor', slug: e.detail.slug })}
          @datasource-create=${(e: CustomEvent<{ name: string }>) => this._onDatasourceCreate(e)}
        ></datasource-list>
      `;
    }

    if (r.view === 'datasource-editor') {
      return html`
        <top-nav .activeSection=${'datasources'}></top-nav>
        <datasource-editor
          .slug=${r.slug}
          .isNew=${r.isNew ?? false}
          .queryPort=${container.queryPort}
          .queryAdapterName=${container.queryAdapterName}
          .capabilitySnapshot=${container.capabilitySnapshot}
        ></datasource-editor>
      `;
    }

    if (r.view === 'editor') {
      const { slug, isNew } = r;
      const config = this._dashboardConfig;
      if (this._dashboardLoadKey !== `${slug}:${isNew ? 'new' : 'existing'}`) {
        this._loadDashboardForRoute();
        return html`<div class="dashboard-not-found">Loading dashboard...</div>`;
      }
      if (this._dashboardLoadError) {
        return html`<div class="dashboard-not-found" role="alert">
          ${this._dashboardLoadError}
        </div>`;
      }
      if (!config) {
        return html`
          <div class="dashboard-not-found">
            <h2 class="dashboard-nf-heading">Dashboard not found</h2>
            <p class="dashboard-nf-text">The dashboard "${slug}" does not exist.</p>
            <ui-button
              .variant=${'primary'}
              .size=${'lg'}
              .content=${'← Back to Dashboards'}
              @click=${() => this._navigate({ view: 'list' })}
            ></ui-button>
          </div>
        `;
      }
      return html`
        <dashboard-editor
          .config=${config}
          .slug=${slug}
          .isNew=${isNew ?? false}
          .queryPort=${container.queryPort}
          .queryAdapterName=${container.queryAdapterName}
          .dataSourceManager=${container.dataSourceManager}
          .createAskEngine=${container.createAskEngine}
          .capabilitySnapshot=${container.capabilitySnapshot}
          @navigate=${(e: CustomEvent<Route>) => this._navigate(e.detail)}
        ></dashboard-editor>
      `;
    }

    return html`
      <top-nav .activeSection=${'dashboards'}></top-nav>
      <dashboard-list
        @dashboard-select=${(e: CustomEvent<{ slug: string }>) => {
          this._navigate({ view: 'editor', slug: e.detail.slug });
        }}
        @dashboard-create=${(e: CustomEvent<{ name: string }>) => this._onDashboardCreate(e)}
      ></dashboard-list>
    `;
  }
}

export class Dashboard extends AppShell {}

if (!customElements.get('app-shell')) {
  customElements.define('app-shell', AppShell);
}

if (!customElements.get('app-dashboard')) {
  customElements.define('app-dashboard', Dashboard);
}
