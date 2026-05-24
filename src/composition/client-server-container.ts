import { HttpDashboardRepository } from '@/adapters/http/http-dashboard-repository';
import { HttpDatasourceRepository } from '@/adapters/http/http-datasource-repository';
import { HttpQueryEngine } from '@/adapters/http/http-query-engine';
import { HttpQuestionRepository } from '@/adapters/http/http-question-repository';
import { GetDashboard } from '@/core/application/use-cases/dashboards/get-dashboard';
import { ListDashboards } from '@/core/application/use-cases/dashboards/list-dashboards';
import { GetDatasource } from '@/core/application/use-cases/datasources/get-datasource';
import { ListDatasources } from '@/core/application/use-cases/datasources/list-datasources';
import { GetQuestion } from '@/core/application/use-cases/questions/get-question';
import { ListQuestions } from '@/core/application/use-cases/questions/list-questions';
import { GetDashboardBySlug } from '@/features/dashboard/model/get-dashboard-by-slug';

import { createPlatformRegistry } from './platform-capabilities';

export function createClientServerContainer() {
  const datasourceRepo = new HttpDatasourceRepository();
  const questionRepo = new HttpQuestionRepository();
  const dashboardRepo = new HttpDashboardRepository();
  const queryEngine = new HttpQueryEngine();
  const platformRegistry = createPlatformRegistry();

  return {
    platformRegistry,
    queryEngine,
    getDatasource: new GetDatasource(datasourceRepo),
    listDatasources: new ListDatasources(datasourceRepo),

    getQuestion: new GetQuestion(questionRepo),
    listQuestions: new ListQuestions(questionRepo),

    getDashboard: new GetDashboard(dashboardRepo),
    listDashboards: new ListDashboards(dashboardRepo),
    getDashboardBySlug: new GetDashboardBySlug(),
  };
}
