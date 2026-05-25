import type { AskDataResponse } from '@/core/entities';
import type { AskDataConfig, ParseOptions, Relationship } from '@/shared/types';

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
