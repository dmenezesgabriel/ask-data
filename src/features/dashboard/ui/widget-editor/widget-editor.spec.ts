import './widget-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardWidget } from '@/core/entities/dashboard';
import type { CapabilitySnapshot } from '@/core/platform';
import { createSeedDashboards } from '@/features/catalog/data/seeded-catalog-repositories';

import type { WidgetEditor } from './widget-editor';

function mount(props: Partial<WidgetEditor>): WidgetEditor {
  const el = document.createElement('widget-editor') as WidgetEditor;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

async function updateComplete(el: WidgetEditor): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

describe('WidgetEditor willUpdate() — UT-001', () => {
  beforeEach(() => {
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function showModal(
      this: HTMLDialogElement,
    ) {
      this.open = true;
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('UT-001: updates _panelConfig from new widget prop before next render', async () => {
    const seedDashboard = createSeedDashboards()[0]!;
    const [widgetA, widgetB] = seedDashboard.widgets as [DashboardWidget, DashboardWidget];

    const el = mount({ widget: widgetA, mode: 'edit' });
    await updateComplete(el);

    const internals = el as unknown as { _panelConfig: { title: string } };
    expect(internals._panelConfig?.title).toBe(widgetA.title);

    el.widget = widgetB;
    // Check _panelConfig after willUpdate runs but before any async side-effect
    await el.updateComplete;
    expect(internals._panelConfig?.title).toBe(widgetB.title);

    el.remove();
  });
});

describe('WidgetEditor capability regression', () => {
  beforeEach(() => {
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function showModal(
      this: HTMLDialogElement,
    ) {
      this.open = true;
    });
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function close(
      this: HTMLDialogElement,
    ) {
      this.open = false;
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('REG-001: keeps seed dashboard chart types available when the widget editor opens', async () => {
    const seedDashboard = createSeedDashboards()[0]!;
    const chartWidgets = seedDashboard.widgets.filter((widget) => widget.type === 'chart');
    const capabilitySnapshot: CapabilitySnapshot = {
      capabilities: chartWidgets.map((widget) => ({
        id: `visualization.chart.${widget.chartType}`,
        displayName: `${widget.chartType} chart`,
        contributionType: 'widget-renderer',
        enabled: true,
      })),
    };

    for (const widget of chartWidgets) {
      const el = mount({ widget, mode: 'edit', capabilitySnapshot });
      await updateComplete(el);

      const options = [...el.querySelectorAll<HTMLSelectElement>('.qep-select option')].map(
        (option) => option.value,
      );
      expect(options).toContain(widget.chartType);

      el.remove();
    }
  });
});
