import type {
  Dashboard,
  DashboardWidget as WidgetConfig,
  Question as QuestionConfig,
} from '@/core/entities';

import type { CellValue, DashboardFilterConfig, Filters } from '../../../../shared/types/index';

export type WidgetDataMap = Record<
  string,
  { labels: string[]; values: number[]; rows?: Record<string, CellValue>[] }
>;

export function storageKeyForDashboard(slug: string): string {
  return `dashboard:${slug || 'default'}`;
}

export function getPersistedWidgetCount(slug: string): number | null {
  try {
    const raw = localStorage.getItem(storageKeyForDashboard(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: { widgets?: unknown[] }[] };
    const sheets = parsed?.data;
    if (!Array.isArray(sheets) || sheets.length === 0) return null;
    const widgets = sheets[0]?.widgets;
    return Array.isArray(widgets) ? widgets.length : null;
  } catch {
    return null;
  }
}

export function applySqlFilters(
  query: string,
  filterDefs: DashboardFilterConfig[],
  filters: Filters,
): string {
  let sql = query;
  for (const filterDef of filterDefs) {
    const placeholder = `--filter:${filterDef.field}--`;
    if (!sql.includes(placeholder)) continue;
    const value = filters[filterDef.field];
    const replacement = value && value !== 'All' ? `'${String(value).replace(/'/g, "''")}'` : '1=1';
    sql = sql.replaceAll(placeholder, replacement);
  }
  return sql;
}

export function filterDashboardData(
  sheetData: WidgetDataMap,
  crossFilters: Record<string, CellValue[]>,
): WidgetDataMap {
  if (!Object.keys(crossFilters).length) return { ...sheetData };

  const filterValues = Object.values(crossFilters).flat() as string[];
  const result: WidgetDataMap = {};

  for (const [widgetId, data] of Object.entries(sheetData)) {
    const rows = (data.rows ?? []).filter((row) => {
      const label = String(row.label ?? row.name ?? '');
      return filterValues.includes(label);
    });

    result[widgetId] = {
      labels: rows.map((row) => String(row.label ?? row.name ?? '')),
      values: rows.map((row) => Number(row.value ?? 0)),
      rows,
    };
  }

  return result;
}

export function exportFileBaseName(sheetName: string): string {
  return sheetName.replace(/\s+/g, '-').toLowerCase();
}

export function questionToWidget(q: QuestionConfig): WidgetConfig {
  return {
    id: `widget-${Date.now()}`,
    type: q.type,
    title: q.title,
    chartType: q.chartType,
    query: q.query,
    queryType: q.queryType ?? 'sql',
    columns: q.columns,
    columnFormats: q.columnFormats as Record<string, 'currency'> | undefined,
    options: q.options,
  };
}

export function sanitizePersistedDashboardLayouts(value: unknown): Dashboard[] {
  if (!Array.isArray(value)) return [];
  return value.map((sheet) => {
    const clean = { ...(sheet as Record<string, unknown>) };
    delete clean.width;
    delete clean.height;
    return clean as unknown as Dashboard;
  });
}
