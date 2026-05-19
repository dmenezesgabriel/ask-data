import type { Datasource as DataSourceConfig } from '@/core/entities';
import { getDbService } from '@/shared/services/db-service';

import type { DashboardConfig } from '../../../shared/types/index';
import { getDatasourceBySlug } from '../../datasource/data/datasource-registry';
import { AskDataEngine } from '../model/ask-data';
import { AskOrchestrator, type AskOrchestratorConfig } from './ask-orchestrator';

export function createDashboardOrchestrator(
  config: DashboardConfig,
  resolvedSources?: DataSourceConfig[],
): AskOrchestrator {
  const db = getDbService();
  const dataSources =
    resolvedSources ??
    ((config.dataSourceSlugs ?? [])
      .map((s) => getDatasourceBySlug(s))
      .filter(Boolean) as DataSourceConfig[]);
  const orchestratorConfig: AskOrchestratorConfig = {
    dataSources,
    askData: config.askData,
    relationships: config.relationships,
  };
  return new AskOrchestrator(orchestratorConfig, db, (cfg) => new AskDataEngine(cfg, db));
}
