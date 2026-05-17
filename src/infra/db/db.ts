import * as duckdb from '@duckdb/duckdb-wasm';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import type { Table } from 'apache-arrow';

import type { QueryPort } from '../query/query-port';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
};

export class DuckDBManager implements QueryPort {
  private dbInstance: duckdb.AsyncDuckDB | null = null;
  private dbConnection: duckdb.AsyncDuckDBConnection | null = null;

  async initialize(): Promise<duckdb.AsyncDuckDB> {
    if (this.dbInstance) return this.dbInstance;
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    const worker = new Worker(bundle.mainWorker!, { type: 'classic' });
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    this.dbInstance = db;
    this.dbConnection = await db.connect();
    return db;
  }

  async getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    await this.initialize();
    if (!this.dbConnection) throw new Error('DuckDB connection was not initialized.');
    return this.dbConnection;
  }

  async query(sql: string): Promise<Table<Record<string, never>>> {
    const connection = await this.getConnection();
    return connection.query<Record<string, never>>(sql);
  }
}

export const duckDBManager = new DuckDBManager();
