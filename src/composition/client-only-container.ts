import { CryptoIdGenerator } from '@/adapters/client/crypto-id-generator';
import { DuckDbWasmQueryEngine } from '@/adapters/client/duckdb-wasm/duckdb-query-engine';
import { LocalStorageDashboardRepository } from '@/adapters/client/local-storage/local-storage-dashboard-repository';
import { LocalStorageDatasourceRepository } from '@/adapters/client/local-storage/local-storage-datasource-repository';
import { LocalStorageQuestionRepository } from '@/adapters/client/local-storage/local-storage-question-repository';
import { SystemClock } from '@/adapters/client/system-clock';
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
import { DuckDBDataSourceManager } from '@/infra/data-sources/data-source-manager';
import { duckDBManager } from '@/infra/db/db';
import { setDbService } from '@/shared/services/db-service';

export function createClientOnlyContainer() {
  const datasourceRepo = new LocalStorageDatasourceRepository();
  const questionRepo = new LocalStorageQuestionRepository();
  const dashboardRepo = new LocalStorageDashboardRepository();
  const idGenerator = new CryptoIdGenerator();
  const clock = new SystemClock();
  const queryEngine = new DuckDbWasmQueryEngine();

  setDbService({
    query: (sql) => duckDBManager.query(sql),
    initialize: () => duckDBManager.initialize(),
    createViews: (sources) => new DuckDBDataSourceManager(duckDBManager).createViews(sources),
  });

  return {
    queryEngine,
    createDatasource: new CreateDatasource(datasourceRepo, idGenerator, clock),
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

export type AppContainer = ReturnType<typeof createClientOnlyContainer>;
