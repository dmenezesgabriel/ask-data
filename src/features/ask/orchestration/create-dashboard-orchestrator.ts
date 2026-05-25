import type { AskEngineFactory, DataSourceManager } from '@/core/application/ports';
import type { Datasource as DataSourceConfig } from '@/core/entities';

import type { DashboardConfig } from '../../../shared/types/index';
import { getDatasourceBySlug } from '../../datasource/data/datasource-registry';
import { AskOrchestrator, type AskOrchestratorConfig } from './ask-orchestrator';

export function createDashboardOrchestrator(
  config: DashboardConfig,
  dataSourceManager: DataSourceManager,
  createAskEngine: AskEngineFactory,
  resolvedSources?: DataSourceConfig[],
): AskOrchestrator {
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
  return new AskOrchestrator(orchestratorConfig, dataSourceManager, createAskEngine);
}
