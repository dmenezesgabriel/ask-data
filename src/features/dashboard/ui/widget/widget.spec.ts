import './index';

import { describe, expect, it, vi } from 'vitest';

import type { DashboardWidget as WidgetConfig } from '@/core/entities';

import { Widget } from './widget';

function mount(config: WidgetConfig, data: Widget['data'] = null): Widget {
  const el = document.createElement('app-widget') as Widget;
  el.config = config;
  el.data = data;
  document.body.appendChild(el);
  return el;
}

function cleanup(el: Widget): void {
  el.remove();
}

async function updateComplete(el: Widget): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

const chartConfig: WidgetConfig = {
  id: 'chart-1',
  type: 'chart',
  title: 'Sales by Region',
  chartType: 'bar',
};

const pieData = {
  labels: ['West', 'East'],
  values: [100, 200],
  rows: [
    { label: 'West', value: 100 },
    { label: 'East', value: 200 },
  ],
};

describe('Widget', () => {
  describe('_initChart()', () => {
    it('destroys previous chart instance before creating a new one when data changes', async () => {
      const el = mount(chartConfig, pieData);
      await updateComplete(el);

      const canvas = el.querySelector('canvas')!;
      expect(canvas).not.toBeNull();

      const initialChart = (el as unknown as { _chartInstance: unknown })._chartInstance;
      expect(initialChart).not.toBeNull();

      el.data = { labels: ['North', 'South'], values: [300, 400] };
      await updateComplete(el);

      const newChart = (el as unknown as { _chartInstance: unknown })._chartInstance;
      expect(newChart).not.toBeNull();
      expect(newChart).not.toBe(initialChart);
      cleanup(el);
    });

    it('logs warning when canvas element is missing', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = mount(chartConfig, pieData);
      await updateComplete(el);

      (el as unknown as { _chartInstance: unknown })._chartInstance = null;

      const canvas = el.querySelector('canvas')!;
      canvas.remove();

      el.data = { labels: ['North', 'South'], values: [300, 400] };
      await updateComplete(el);

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('chart.init.missingCanvas'),
        expect.objectContaining({ widgetId: 'chart-1' }),
      );
      warn.mockRestore();
      cleanup(el);
    });

    it('does not log warning when canvas element is present', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = mount(chartConfig, pieData);
      await updateComplete(el);

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('chart.init.missingCanvas'),
        expect.anything(),
      );
      warn.mockRestore();
      cleanup(el);
    });
  });
});
