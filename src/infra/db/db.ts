import * as duckdb from '@duckdb/duckdb-wasm';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import type { Table } from 'apache-arrow';

import type { QueryPort } from '@/core/application/ports';
import { createLogger, summarizeSql } from '@/shared/observability/logger';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
};

class DuckDbAppLogger implements duckdb.Logger {
  private readonly logger = createLogger('duckdb.runtime');

  log(entry: duckdb.LogEntryVariant): void {
    const metadata = {
      topic: duckdb.getLogTopicLabel(entry.topic),
      event: duckdb.getLogEventLabel(entry.event),
      origin: duckdb.getLogOriginLabel(entry.origin),
      ...(entry.value === undefined ? {} : { value: entry.value }),
    };

    switch (entry.level) {
      case duckdb.LogLevel.ERROR:
        this.logger.error('event', metadata);
        break;
      case duckdb.LogLevel.WARNING:
        this.logger.warn('event', metadata);
        break;
      default:
        this.logger.debug('event', metadata);
        break;
    }
  }
}

export class DuckDBManager implements QueryPort {
  private readonly logger = createLogger('duckdb');
  private dbInstance: duckdb.AsyncDuckDB | null = null;
  private dbConnection: duckdb.AsyncDuckDBConnection | null = null;

  async initialize(): Promise<duckdb.AsyncDuckDB> {
    if (this.dbInstance) return this.dbInstance;

    const span = this.logger.span('initialize');

    try {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!, { type: 'classic' });
      const logger = new DuckDbAppLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      this.dbInstance = db;
      this.dbConnection = await db.connect();
      span.end({ bundle: bundle.mainModule === ehWasm ? 'eh' : 'mvp' }, 'debug');
      return db;
    } catch (error) {
      span.fail(error);
      throw error;
    }
  }

  async getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    await this.initialize();
    if (!this.dbConnection) throw new Error('DuckDB connection was not initialized.');
    return this.dbConnection;
  }

  async query(sql: string): Promise<Table<Record<string, never>>> {
    const connection = await this.getConnection();
    const startedAt = performance.now();
    const summary = summarizeSql(sql);

    try {
      const result = await connection.query<Record<string, never>>(sql);
      const durationMs = Math.round(performance.now() - startedAt);
      const metadata = {
        sql: summary,
        durationMs,
        rowCount: result.numRows,
      };

      if (durationMs >= 1_000) {
        this.logger.warn('query.slow', metadata);
      } else {
        this.logger.debug('query.ok', metadata);
      }

      return result;
    } catch (error) {
      this.logger.error('query.failed', error, {
        sql: summary,
        durationMs: Math.round(performance.now() - startedAt),
      });
      throw error;
    }
  }
}

export const duckDBManager = new DuckDBManager();
