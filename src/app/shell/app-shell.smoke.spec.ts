import './app-shell';

import { describe, expect, it, vi } from 'vitest';

type AsyncElement = HTMLElement & { updateComplete: Promise<unknown> };

async function updateComplete(el: AsyncElement): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

describe('AppShell smoke', () => {
  it('SMK-001: renders the client-only app shell without composition errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.location.hash = '';

    const el = document.createElement('app-shell') as AsyncElement;
    document.body.appendChild(el);
    await updateComplete(el);

    expect(el.querySelector('top-nav')).not.toBeNull();
    expect(el.querySelector('dashboard-list')).not.toBeNull();
    expect(el.textContent).not.toContain('CatalogService not initialized');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('CatalogService not initialized');

    el.remove();
    consoleError.mockRestore();
  });
});
