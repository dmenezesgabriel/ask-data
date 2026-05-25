import type {
  AskEngine,
  AskEngineConfig,
  AskEngineFactory,
  DataSourceManager,
} from '@/core/application/ports';

import type { AskDataResponse, Clarification, DashboardConfig } from '../../../shared/types/index';

export type { AskEngine } from '@/core/application/ports';

export type AskOrchestratorConfig = AskEngineConfig & {
  askData: DashboardConfig['askData'];
  relationships?: DashboardConfig['relationships'];
};

export class AskOrchestrator {
  private config: AskOrchestratorConfig;
  private dataSourceManager: DataSourceManager;
  private engine: AskEngine | null = null;
  private engineFactory: AskEngineFactory;
  private initialized = false;

  constructor(
    config: AskOrchestratorConfig,
    dataSourceManager: DataSourceManager,
    engineFactory: AskEngineFactory,
  ) {
    this.config = config;
    this.dataSourceManager = dataSourceManager;
    this.engineFactory = engineFactory;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.engine) {
      this.engine = this.engineFactory(this.config);
    }
    await this.dataSourceManager.createViews(this.config.dataSources ?? []);
    const engine = this.engine;
    await engine.initialize();
    this.initialized = true;
  }

  async ask(
    question: string,
    options?: { clarification?: Clarification['pending'] },
  ): Promise<AskDataResponse> {
    await this.initialize();
    if (!this.engine) throw new Error('Engine not initialized');
    return this.engine.ask(question, options ?? {});
  }
}
