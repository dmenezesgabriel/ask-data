import type { SourceColumnRef } from './ask';

export interface DashboardFilterConfig {
  field: string;
  label: string;
  source: SourceColumnRef;
  type: 'select' | string;
}

export interface KpiConfig {
  id: string;
  title: string;
  query: string;
  format?: 'currency';
}

export interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  dataSourceSlugs?: string[];
  source?: 'yaml' | 'user';
  createdAt?: string;
  updatedAt?: string;
}
