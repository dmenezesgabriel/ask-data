import type { DashboardFilterConfig, KpiConfig, Position } from '@/shared/types/dashboard';

export type { DashboardFilterConfig, KpiConfig, Position };

export type WidgetType = 'chart' | 'table' | 'kpi' | 'text' | 'image' | 'filter';
export type ChartType2 =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'histogram'
  | 'gauge'
  | 'funnel';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  query?: string;
  queryType?: 'nl' | 'sql';
  chartType?: ChartType2;
  columns?: string[];
  columnFormats?: Record<string, 'currency'>;
  kpiConfig?: KpiConfig;
  textContent?: string;
  filters?: DashboardFilterConfig[];
  crossFilterFields?: string[];
  options?: Record<string, unknown>;
  backgroundColor?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  type: 'layout' | 'dashboard';
  widgets: DashboardWidget[];
  layout: Position[];
  filters?: DashboardFilterConfig[];
  source?: 'yaml' | 'user';
  createdAt?: string;
  updatedAt?: string;
}
