import type { QueryResult } from '@/core/entities';

export interface QueryEngine {
  execute(input: { datasourceId: string; sql: string }): Promise<QueryResult>;
}
