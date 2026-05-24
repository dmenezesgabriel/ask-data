import type { Datasource, QueryResult } from '@/core/entities';

export type ContributionType =
  | 'datasource-connector'
  | 'query-executor'
  | 'semantic-model-provider'
  | 'widget-renderer'
  | 'exporter'
  | 'storage-provider';

export type Capability = {
  id: string;
  displayName: string;
  contributionType: ContributionType;
  enabled: boolean;
  featureFlagKey?: string;
};

export type DatasourceReference = Pick<Datasource, 'type' | 'url'> & {
  id?: string;
};

export type DatasourceLoadResult = QueryResult;

export interface DatasourceConnector {
  capability: Capability & { contributionType: 'datasource-connector' };
  accepts(datasource: DatasourceReference): boolean;
  load(datasource: DatasourceReference): Promise<DatasourceLoadResult>;
}

export type QueryExecutionInput = {
  datasourceId: string;
  sql: string;
  parameters?: readonly unknown[];
};

export interface QueryExecutor {
  capability: Capability & { contributionType: 'query-executor' };
  execute(input: QueryExecutionInput): Promise<QueryResult>;
}

export type SemanticField = {
  id: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  synonyms?: readonly string[];
};

export type SemanticModel = {
  id: string;
  datasourceId?: string;
  fields: readonly SemanticField[];
};

export interface SemanticModelProvider {
  capability: Capability & { contributionType: 'semantic-model-provider' };
  getSemanticModel(datasourceId?: string): Promise<SemanticModel>;
}

export type WidgetRenderInput = {
  widgetId: string;
  queryResult: QueryResult;
  options?: Record<string, unknown>;
};

export type WidgetRenderResult = {
  kind: 'table' | 'chart' | 'text' | 'custom';
  title?: string;
  data: unknown;
};

export interface WidgetRenderer {
  capability: Capability & { contributionType: 'widget-renderer' };
  render(input: WidgetRenderInput): Promise<WidgetRenderResult>;
}

export type ExportInput = {
  name: string;
  queryResult: QueryResult;
  options?: Record<string, unknown>;
};

export type ExportResult = {
  filename: string;
  mediaType: string;
  content: string | Uint8Array;
};

export interface Exporter {
  capability: Capability & { contributionType: 'exporter' };
  export(input: ExportInput): Promise<ExportResult>;
}

export interface StorageProvider {
  capability: Capability & { contributionType: 'storage-provider' };
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export type ContributionByType = {
  'datasource-connector': DatasourceConnector;
  'query-executor': QueryExecutor;
  'semantic-model-provider': SemanticModelProvider;
  'widget-renderer': WidgetRenderer;
  exporter: Exporter;
  'storage-provider': StorageProvider;
};

export type PlatformContribution = ContributionByType[ContributionType];
