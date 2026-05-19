import { CryptoIdGenerator } from '@/adapters/client/crypto-id-generator';
import { SystemClock } from '@/adapters/client/system-clock';
import { HttpDashboardRepository } from '@/adapters/http/http-dashboard-repository';
import { HttpDatasourceRepository } from '@/adapters/http/http-datasource-repository';
import { HttpQueryEngine } from '@/adapters/http/http-query-engine';
import { HttpQuestionRepository } from '@/adapters/http/http-question-repository';
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

export function createClientServerContainer() {
  const datasourceRepo = new HttpDatasourceRepository();
  const questionRepo = new HttpQuestionRepository();
  const dashboardRepo = new HttpDashboardRepository();
  const idGenerator = new CryptoIdGenerator();
  const clock = new SystemClock();
  const queryEngine = new HttpQueryEngine();

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
