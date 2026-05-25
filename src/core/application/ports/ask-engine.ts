import type { AskDataConfig, AskDataResponse, ParseOptions, Relationship } from '@/core/entities';

import type { DataSourceEntry } from './data-source-manager-port';

export interface AskEngineConfig {
  dataSources?: DataSourceEntry[];
  relationships?: Relationship[];
  askData?: Partial<AskDataConfig>;
}

export interface AskEngine {
  initialize(): Promise<void>;
  ask(question: string, options?: ParseOptions & Record<string, unknown>): Promise<AskDataResponse>;
}

export type AskEngineFactory = (config: AskEngineConfig) => AskEngine;
