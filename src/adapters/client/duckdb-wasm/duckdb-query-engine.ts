import type { QueryEngine } from '@/core/application/ports';
import type { QueryResult } from '@/core/entities';

// Lazy import to avoid loading WASM during tests
async function getDuckDBManager() {
  const { duckDBManager } = await import('@/infra/db/db');
  return duckDBManager;
}

export class DuckDbWasmQueryEngine implements QueryEngine {
  async execute({ sql }: { datasourceId: string; sql: string }): Promise<QueryResult> {
    const manager = await getDuckDBManager();
    const raw = await manager.query(sql);
    // Convert Arrow Table to rows using same pattern as toRows helper
    const rows = raw
      .toArray()
      .map((r: unknown) =>
        Object.fromEntries(
          Object.entries(r as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === 'bigint' ? Number(v) : v,
          ]),
        ),
      );
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  }
}
