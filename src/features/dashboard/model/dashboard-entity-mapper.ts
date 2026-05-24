import type { ChartType } from 'chart.js';

import type { Dashboard, DashboardWidget } from '@/core/entities';
import type { DashboardConfig } from '@/shared/types';

import { createEmptyDashboardConfig } from './dashboard-config';

export type DashboardEntry = {
  slug: string;
  config: DashboardConfig;
  source: Dashboard['source'];
};

function isWidgetType(widget: DashboardWidget, type: DashboardWidget['type']): boolean {
  return widget.type === type;
}

export function dashboardEntityToConfig(dashboard: Dashboard): DashboardConfig {
  const config = createEmptyDashboardConfig(dashboard.name);
  const widgets = dashboard.widgets ?? [];

  return {
    ...config,
    filters: dashboard.filters ?? [],
    layout: dashboard.layout ?? [],
    kpis: widgets
      .filter((widget) => isWidgetType(widget, 'kpi'))
      .map((widget) => ({
        id: widget.id,
        title: widget.title,
        query: widget.query ?? '',
        ...(widget.kpiConfig ?? {}),
      })),
    charts: widgets
      .filter((widget) => isWidgetType(widget, 'chart'))
      .map((widget) => ({
        id: widget.id,
        title: widget.title,
        query: widget.query ?? '',
        type: (widget.chartType ?? 'bar') as ChartType,
        options: widget.options,
      })),
    tables: widgets
      .filter((widget) => isWidgetType(widget, 'table'))
      .map((widget) => ({
        id: widget.id,
        title: widget.title,
        query: widget.query ?? '',
        columns: widget.columns ?? [],
        columnFormats: widget.columnFormats,
      })),
  };
}

export function dashboardEntityToEntry(dashboard: Dashboard): DashboardEntry {
  return {
    slug: dashboard.id,
    config: dashboardEntityToConfig(dashboard),
    source: dashboard.source ?? 'user',
  };
}
