import './dashboard-editor';

import { describe, expect, it, vi } from 'vitest';

import { createClientOnlyContainer } from '@/composition/client-only-container';
import { createEmptyDashboardConfig } from '@/features/dashboard/model/dashboard-config';

import type { DashboardEditor } from './dashboard-editor';

describe('DashboardEditor Ask Data smoke', () => {
  it('SMK-001: initializes Ask Data UI in client-only mode without a missing DB service error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = createClientOnlyContainer();
    const el = document.createElement('dashboard-editor') as DashboardEditor;
    Object.assign(el, {
      config: createEmptyDashboardConfig('Client-only Ask Data'),
      queryPort: container.queryPort,
      queryAdapterName: container.queryAdapterName,
      dataSourceManager: container.dataSourceManager,
      createAskEngine: container.createAskEngine,
    });
    (el as unknown as { _activeTab: 'askData' })._activeTab = 'askData';

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.querySelector('ask-input')).not.toBeNull();
    expect(el.textContent).not.toContain('DbService not initialized');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('DbService not initialized');
    el.remove();
  });
});
