import { CryptoIdGenerator } from '@/adapters/client/crypto-id-generator';
import { DuckDbWasmQueryEngine } from '@/adapters/client/duckdb-wasm/duckdb-query-engine';
import { LocalStorageDashboardRepository } from '@/adapters/client/local-storage/local-storage-dashboard-repository';
import { LocalStorageDatasourceRepository } from '@/adapters/client/local-storage/local-storage-datasource-repository';
import { LocalStorageQuestionRepository } from '@/adapters/client/local-storage/local-storage-question-repository';
import { SystemClock } from '@/adapters/client/system-clock';
import type { AskEngineConfig, DataSourceManager, QueryPort } from '@/core/application/ports';
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
import {
  SeededDashboardRepository,
  SeededDatasourceRepository,
  SeededQuestionRepository,
} from '@/features/catalog/data/seeded-catalog-repositories';
import { DuckDBDataSourceManager } from '@/infra/data-sources/data-source-manager';
import { duckDBManager } from '@/infra/db/db';

import { createPlatformRegistry } from './platform-capabilities';

export function createClientOnlyContainer() {
  const clock = new SystemClock();
  const idGenerator = new CryptoIdGenerator();
  const datasourceRepo = new SeededDatasourceRepository(
    new LocalStorageDatasourceRepository(clock),
  );
  const questionRepo = new SeededQuestionRepository(new LocalStorageQuestionRepository(clock));
  const dashboardRepo = new SeededDashboardRepository(new LocalStorageDashboardRepository());
  const queryEngine = new DuckDbWasmQueryEngine();
  const queryPort: QueryPort = duckDBManager;
  const dataSourceManager: DataSourceManager = new DuckDBDataSourceManager(queryPort);
  const createAskEngine = (config: AskEngineConfig) => new AskDataEngine(config, queryPort);
  const platformRegistry = createPlatformRegistry();

  return {
    platformRegistry,
    capabilitySnapshot: platformRegistry.getSnapshot(),
    queryEngine,
    queryPort,
    queryAdapterName: 'duckdb-wasm',
    dataSourceManager,
    createAskEngine,
    createDatasource: new CreateDatasource(datasourceRepo, idGenerator, clock, platformRegistry),
    updateDatasource: new UpdateDatasource(datasourceRepo, clock),
    deleteDatasource: new DeleteDatasource(datasourceRepo),
    getDatasource: new GetDatasource(datasourceRepo),
    listDatasources: new ListDatasources(datasourceRepo),

    createQuestion: new CreateQuestion(questionRepo, idGenerator, clock),
    updateQuestion: new UpdateQuestion(questionRepo, clock),
    deleteQuestion: new DeleteQuestion(questionRepo),
    getQuestion: new GetQuestion(questionRepo),
    listQuestions: new ListQuestions(questionRepo),

    createDashboard: new CreateDashboard(dashboardRepo, idGenerator, clock),
    updateDashboard: new UpdateDashboard(dashboardRepo, clock),
    deleteDashboard: new DeleteDashboard(dashboardRepo),
    getDashboard: new GetDashboard(dashboardRepo),
    listDashboards: new ListDashboards(dashboardRepo),
  };
}

// Write-only methods are optional so both client-only and client-server containers satisfy
// this interface without a cast. AppShell and other client-only callers can use non-null
// assertion (!) because they run exclusively in the browser where all methods are present.
type _Full = ReturnType<typeof createClientOnlyContainer>;
type _WriteKeys =
  | 'createDatasource'
  | 'updateDatasource'
  | 'deleteDatasource'
  | 'createQuestion'
  | 'updateQuestion'
  | 'deleteQuestion'
  | 'createDashboard'
  | 'updateDashboard'
  | 'deleteDashboard';

export type AppContainer = Omit<_Full, _WriteKeys> & Partial<Pick<_Full, _WriteKeys>>;
