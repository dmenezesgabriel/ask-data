import type { DashboardConfig } from '../../../shared/types/index';

export function createEmptyDashboardConfig(title = 'New Dashboard'): DashboardConfig {
  return {
    title,
    subtitle: '',
    dataSourceSlugs: [],
    askData: { defaultQuestion: '' },
    filters: [],
    kpis: [],
    charts: [],
    tables: [],
    layout: [],
    relationships: [],
  };
}

// Default used when rendering a new dashboard before the user has saved anything.
export const DASHBOARD_CONFIG: DashboardConfig = createEmptyDashboardConfig('New Dashboard');
