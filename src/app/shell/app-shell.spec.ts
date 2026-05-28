import './app-shell';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { container } from '../../composition/app-container';

type AsyncElement = HTMLElement & { updateComplete: Promise<unknown> };
type ShellInternals = { _onDashboardCreate(e: CustomEvent): Promise<void> };

describe('AppShell — post-create navigation', () => {
  let el: AsyncElement;
  let originalCreateDashboard: typeof container.createDashboard;
  let originalGetDashboard: typeof container.getDashboard;

  beforeEach(() => {
    originalCreateDashboard = container.createDashboard;
    originalGetDashboard = container.getDashboard;
    window.location.hash = '';
  });

  afterEach(() => {
    el?.remove();
    container.createDashboard = originalCreateDashboard;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (container as any).getDashboard = originalGetDashboard;
    window.location.hash = '';
  });

  it('UT-001: navigates to #/dashboard/<slug> without isNew after dashboard is created', async () => {
    const testSlug = 'q1-sales-abc123';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (container as any).createDashboard = {
      execute: vi.fn().mockResolvedValue({ id: testSlug }),
    };

    el = document.createElement('app-shell') as AsyncElement;
    document.body.appendChild(el);
    await el.updateComplete;

    await (el as unknown as ShellInternals)._onDashboardCreate(
      new CustomEvent('dashboard-create', { detail: { name: 'Q1 Sales' } }),
    );

    expect(window.location.hash).toBe(`#/dashboard/${testSlug}`);
    expect(window.location.hash).not.toContain('new');
  });

  it('REG-001: renders dashboard-editor with fetched title instead of "Loading dashboard..."', async () => {
    const testSlug = 'q1-sales-abc123';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (container as any).getDashboard = {
      execute: vi.fn().mockResolvedValue({
        id: testSlug,
        name: 'Q1 Sales',
        type: 'dashboard' as const,
        widgets: [],
        layout: [],
      }),
    };
    window.location.hash = `#/dashboard/${testSlug}`;

    el = document.createElement('app-shell') as AsyncElement;
    document.body.appendChild(el);
    await el.updateComplete; // initial render triggers _loadDashboardForRoute
    await el.updateComplete; // re-render after getDashboard resolves

    expect(el.querySelector('.dashboard-not-found')).toBeNull();
    const editor = el.querySelector('dashboard-editor') as
      | (HTMLElement & { config?: { title: string } })
      | null;
    expect(editor).not.toBeNull();
    expect(editor!.config?.title).toBe('Q1 Sales');
  });
});
