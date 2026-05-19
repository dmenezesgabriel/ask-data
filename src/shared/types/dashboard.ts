import type { ChartConfiguration, ChartType } from 'chart.js';

import type { AskDataConfig, Relationship, SourceColumnRef } from '@/shared/types/ask';

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

export interface ChartConfig {
  id: string;
  type: ChartType;
  query: string;
  title?: string;
  options?: ChartConfiguration['options'];
  section?: string;
}

export interface TableConfig {
  id: string;
  title: string;
  query: string;
  columns: string[];
  columnFormats?: Record<string, 'currency'>;
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  dataSourceSlugs?: string[];
  askData: AskDataConfig;
  filters: DashboardFilterConfig[];
  kpis: KpiConfig[];
  charts: ChartConfig[];
  tables: TableConfig[];
  layout?: Position[];
  relationships?: Relationship[];
}
