import type { QueryEngine } from '@/core/application/ports';
import type { QueryResult } from '@/core/entities';

export class HttpQueryEngine implements QueryEngine {
  constructor(private readonly baseUrl: string = '/api/query') {}

  async execute(input: { datasourceId: string; sql: string }): Promise<QueryResult> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Query failed: ${res.status}`);
    return res.json() as Promise<QueryResult>;
  }
}
