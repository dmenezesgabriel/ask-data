import { MemoryDashboardRepository } from '@/adapters/memory/memory-dashboard-repository';
import { MemoryDatasourceRepository } from '@/adapters/memory/memory-datasource-repository';
import { MemoryQueryEngine } from '@/adapters/memory/memory-query-engine';
import { MemoryQuestionRepository } from '@/adapters/memory/memory-question-repository';
import type { AskEngineConfig, Clock, IdGenerator, QueryPort } from '@/core/application/ports';
import { CreateDashboard } from '@/core/application/use-cases/dashboards/create-dashboard';
import { DeleteDashboard } from '@/core/application/use-cases/dashboards/delete-dashboard';
import { GetDashboard } from '@/core/application/use-cases/dashboards/get-dashboard';
import { ListDashboards } from '@/core/application/use-cases/dashboards/list-dashboards';
import { UpdateDashboard } from '@/core/application/use-cases/dashboards/update-dashboard';
import { CreateDatasource } from '@/core/application/use-cases/datasources/create-datasource';
import { DeleteDatasource } from '@/core/application/use-cases/datasources/delete-datasource';
import { GetDatasource } from '@/core/application/use-cases/datasources/get-datasource';
import { ListDatasources } from '@/core/application/use-cases/datasources/list-datasources';
import { UpdateDatasource } from '@/core/application/use-cases/datasources/update-datasource';
import { CreateQuestion } from '@/core/application/use-cases/questions/create-question';
import { DeleteQuestion } from '@/core/application/use-cases/questions/delete-question';
import { GetQuestion } from '@/core/application/use-cases/questions/get-question';
import { ListQuestions } from '@/core/application/use-cases/questions/list-questions';
import { UpdateQuestion } from '@/core/application/use-cases/questions/update-question';
import { AskDataEngine } from '@/features/ask/model/ask-data';
import { createLogger } from '@/shared/observability/logger';

import {
  type ApplicationComposition,
  createApplicationCapabilitySnapshot,
  createOperationCapabilities,
  logCompositionStartup,
  supportedOperations,
} from './application-composition';
import { createPlatformRegistry } from './platform-capabilities';

class SequenceIdGenerator implements IdGenerator {
  private nextId = 1;

  create(): string {
    const id = `memory-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

class FixedClock implements Clock {
  now(): string {
    return '2026-05-25T00:00:00.000Z';
  }
}

export function createServerlessComposition(): ApplicationComposition {
  const clock = new FixedClock();
  const idGenerator = new SequenceIdGenerator();
  const datasourceRepo = new MemoryDatasourceRepository();
  const questionRepo = new MemoryQuestionRepository();
  const dashboardRepo = new MemoryDashboardRepository();
  const queryEngine = new MemoryQueryEngine();
  const queryPort: QueryPort = {
    query: (sql) => queryEngine.execute({ datasourceId: 'default', sql }),
  };
  const dataSourceManager = {
    async createViews(): Promise<void> {},
  };
  const createAskEngine = (config: AskEngineConfig) => new AskDataEngine(config, queryPort);
  const platformRegistry = createPlatformRegistry();
  const capabilitySnapshot = createApplicationCapabilitySnapshot(
    platformRegistry.getSnapshot(),
    createOperationCapabilities(true),
  );
  const logger = createLogger('composition.serverless');
  const createDatasource = new CreateDatasource(
    datasourceRepo,
    idGenerator,
    clock,
    platformRegistry,
  );
  const updateDatasource = new UpdateDatasource(datasourceRepo, clock);
  const deleteDatasource = new DeleteDatasource(datasourceRepo);
  const getDatasource = new GetDatasource(datasourceRepo);
  const listDatasources = new ListDatasources(datasourceRepo);
  const createQuestion = new CreateQuestion(questionRepo, idGenerator, clock);
  const updateQuestion = new UpdateQuestion(questionRepo, clock);
  const deleteQuestion = new DeleteQuestion(questionRepo);
  const getQuestion = new GetQuestion(questionRepo);
  const listQuestions = new ListQuestions(questionRepo);
  const createDashboard = new CreateDashboard(dashboardRepo, idGenerator, clock);
  const updateDashboard = new UpdateDashboard(dashboardRepo, clock);
  const deleteDashboard = new DeleteDashboard(dashboardRepo);
  const getDashboard = new GetDashboard(dashboardRepo);
  const listDashboards = new ListDashboards(dashboardRepo);

  const composition = {
    deploymentMode: 'serverless',
    platformRegistry,
    capabilitySnapshot,
    queryEngine,
    queryPort,
    queryAdapterName: 'memory',
    dataSourceManager,
    createAskEngine,
    catalog: {
      datasources: {
        get: getDatasource,
        list: listDatasources,
        mutations: supportedOperations('catalog.datasources.write', {
          create: createDatasource,
          update: updateDatasource,
          delete: deleteDatasource,
        }),
      },
      questions: {
        get: getQuestion,
        list: listQuestions,
        mutations: supportedOperations('catalog.questions.write', {
          create: createQuestion,
          update: updateQuestion,
          delete: deleteQuestion,
        }),
      },
      dashboards: {
        get: getDashboard,
        list: listDashboards,
        mutations: supportedOperations('catalog.dashboards.write', {
          create: createDashboard,
          update: updateDashboard,
          delete: deleteDashboard,
        }),
      },
    },
    observability: {
      logger,
      logStartup() {
        logCompositionStartup(composition);
      },
    },
  } satisfies ApplicationComposition;

  composition.observability.logStartup();
  return composition;
}
