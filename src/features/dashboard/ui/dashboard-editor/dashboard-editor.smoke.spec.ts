import './dashboard-editor';
import '../../../datasource/ui/datasource-editor/datasource-editor';
import '../../../question/ui/question-editor/question-editor';

import { describe, expect, it, vi } from 'vitest';

import type { DataSourceManager, QueryPort } from '@/core/application/ports';
import { createEmptyDashboardConfig } from '@/features/dashboard/model/dashboard-config';
import { setCatalogService } from '@/shared/services/catalog-service';

import type { DashboardEditor } from './dashboard-editor';

type AsyncElement = HTMLElement & { updateComplete: Promise<unknown> };

async function updateComplete(el: AsyncElement): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

describe('Default capability screen smoke', () => {
  it('SMK-001: loads dashboard, datasource, and question screens without external flag configuration', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const queryPort: QueryPort = { query: vi.fn() };
    const dataSourceManager: DataSourceManager = { createViews: vi.fn() };
    const createAskEngine = vi.fn();
    setCatalogService({
      getDatasource: { execute: async () => null },
      listDatasources: { execute: async () => [] },
      getQuestion: { execute: async () => null },
      listQuestions: { execute: async () => [] },
      getDashboard: { execute: async () => null },
      listDashboards: { execute: async () => [] },
    });

    const dashboard = document.createElement('dashboard-editor') as DashboardEditor;
    Object.assign(dashboard, {
      config: createEmptyDashboardConfig('Client-only Ask Data'),
      queryPort,
      queryAdapterName: 'test-query',
      dataSourceManager,
      createAskEngine,
    });
    (dashboard as unknown as { _activeTab: 'askData' })._activeTab = 'askData';

    const datasource = document.createElement('datasource-editor') as AsyncElement & {
      slug: string;
      isNew: boolean;
    };
    Object.assign(datasource, {
      slug: 'new',
      isNew: true,
    });

    const question = document.createElement('question-editor') as AsyncElement & {
      slug: string;
      isNew: boolean;
      queryPort: unknown;
      queryAdapterName: string;
      dataSourceManager: unknown;
      createAskEngine: unknown;
    };
    Object.assign(question, {
      slug: 'new',
      isNew: true,
      queryPort,
      queryAdapterName: 'test-query',
      dataSourceManager,
      createAskEngine,
    });

    document.body.append(dashboard, datasource, question);
    await Promise.all([
      updateComplete(dashboard),
      updateComplete(datasource),
      updateComplete(question),
    ]);

    expect(dashboard.querySelector('ask-input')).not.toBeNull();
    expect(datasource.querySelector('datasource-editor-panel')).not.toBeNull();
    expect(question.querySelector('question-editor-panel')).not.toBeNull();
    expect(document.body.textContent).not.toContain('DbService not initialized');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('DbService not initialized');
    dashboard.remove();
    datasource.remove();
    question.remove();
  });
});
