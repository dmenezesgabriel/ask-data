import type { QueryEngine } from '@/core/application/ports';
import type { QueryResult } from '@/core/entities';

export class MemoryQueryEngine implements QueryEngine {
  constructor(private readonly result: QueryResult = { columns: [], rows: [] }) {}

  async execute(_input: { datasourceId: string; sql: string }): Promise<QueryResult> {
    return this.result;
  }
}
