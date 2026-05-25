import { HttpDashboardRepository } from '@/adapters/http/http-dashboard-repository';
import { HttpDatasourceRepository } from '@/adapters/http/http-datasource-repository';
import { HttpQueryEngine } from '@/adapters/http/http-query-engine';
import { HttpQuestionRepository } from '@/adapters/http/http-question-repository';
import type { AskEngineConfig, DataSourceEntry, QueryPort } from '@/core/application/ports';
import { GetDashboard } from '@/core/application/use-cases/dashboards/get-dashboard';
import { ListDashboards } from '@/core/application/use-cases/dashboards/list-dashboards';
import { GetDatasource } from '@/core/application/use-cases/datasources/get-datasource';
import { ListDatasources } from '@/core/application/use-cases/datasources/list-datasources';
import { GetQuestion } from '@/core/application/use-cases/questions/get-question';
import { ListQuestions } from '@/core/application/use-cases/questions/list-questions';
import { AskDataEngine } from '@/features/ask/model/ask-data';
import { GetDashboardBySlug } from '@/features/dashboard/model/get-dashboard-by-slug';
import { createLogger } from '@/shared/observability/logger';

import {
  type ApplicationComposition,
  createApplicationCapabilitySnapshot,
  createOperationCapabilities,
  logCompositionStartup,
  unsupportedOperations,
} from './application-composition';
import { createPlatformRegistry } from './platform-capabilities';

export function createClientServerContainer() {
  const datasourceRepo = new HttpDatasourceRepository();
  const questionRepo = new HttpQuestionRepository();
  const dashboardRepo = new HttpDashboardRepository();
  const queryEngine = new HttpQueryEngine();
  const queryPort: QueryPort = {
    query: (sql) => queryEngine.execute({ datasourceId: 'default', sql }),
  };
  const dataSourceManager = {
    async createViews(_sources: DataSourceEntry[]): Promise<void> {
      // Server-backed query adapters own datasource preparation behind the HTTP boundary.
    },
  };
  const createAskEngine = (config: AskEngineConfig) => new AskDataEngine(config, queryPort);
  const platformRegistry = createPlatformRegistry();
  const capabilitySnapshot = createApplicationCapabilitySnapshot(
    platformRegistry.getSnapshot(),
    createOperationCapabilities(
      false,
      'Client-server mode exposes catalog writes only when an HTTP write API is composed.',
    ),
  );
  const logger = createLogger('composition.client-server');
  const getDatasource = new GetDatasource(datasourceRepo);
  const listDatasources = new ListDatasources(datasourceRepo);
  const getQuestion = new GetQuestion(questionRepo);
  const listQuestions = new ListQuestions(questionRepo);
  const getDashboard = new GetDashboard(dashboardRepo);
  const listDashboards = new ListDashboards(dashboardRepo);

  const composition = {
    deploymentMode: 'client-server',
    platformRegistry,
    capabilitySnapshot,
    queryEngine,
    queryPort,
    queryAdapterName: 'http',
    dataSourceManager,
    createAskEngine,
    catalog: {
      datasources: {
        get: getDatasource,
        list: listDatasources,
        mutations: unsupportedOperations(
          'catalog.datasources.write',
          'Client-server mode exposes catalog writes only when an HTTP write API is composed.',
        ),
      },
      questions: {
        get: getQuestion,
        list: listQuestions,
        mutations: unsupportedOperations(
          'catalog.questions.write',
          'Client-server mode exposes catalog writes only when an HTTP write API is composed.',
        ),
      },
      dashboards: {
        get: getDashboard,
        list: listDashboards,
        mutations: unsupportedOperations(
          'catalog.dashboards.write',
          'Client-server mode exposes catalog writes only when an HTTP write API is composed.',
        ),
      },
    },
    observability: {
      logger,
      logStartup() {
        logCompositionStartup(composition);
      },
    },
    getDatasource,
    listDatasources,

    getQuestion,
    listQuestions,

    getDashboard,
    listDashboards,
    getDashboardBySlug: new GetDashboardBySlug(),
  } satisfies ApplicationComposition & Record<string, unknown>;

  composition.observability.logStartup();
  return composition;
}
