import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger, summarizeSql } from './logger';

describe('logger', () => {
  const originalLevel = globalThis.__ASK_DATA_LOG_LEVEL__;

  beforeEach(() => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = 'info';
  });

  afterEach(() => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = originalLevel;
    vi.restoreAllMocks();
  });

  it('filters messages below the configured level', () => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = 'warn';
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('test');

    logger.debug('hidden.debug');
    logger.info('hidden.info');
    logger.warn('visible.warn');
    logger.error('visible.error');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('adds trace ids and durations to spans', () => {
    globalThis.__ASK_DATA_LOG_LEVEL__ = 'debug';
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = createLogger('test');

    const span = logger.span('operation', { feature: 'ask' });
    span.end({ rows: 4 });

    expect(debug).toHaveBeenCalledWith(
      '[test] operation.start',
      expect.objectContaining({
        feature: 'ask',
        traceId: expect.any(String),
      }),
    );
    expect(info).toHaveBeenCalledWith(
      '[test] operation.ok',
      expect.objectContaining({
        durationMs: expect.any(Number),
        feature: 'ask',
        rows: 4,
        traceId: expect.any(String),
      }),
    );
  });

  it('summarizes long SQL into a single readable line', () => {
    const sql = `SELECT\n  customer_id,\n  SUM(amount) AS total\nFROM sales\nGROUP BY 1\nORDER BY 2 DESC`;
    expect(summarizeSql(sql, 40)).toBe('SELECT customer_id, SUM(amount) AS tota…');
  });

  it('ST-001: redacts raw SQL and datasource URLs from failed query logs by default', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('query-test');

    logger.error(
      'query.failed',
      new Error("Failed SELECT * FROM read_csv('https://example.com/private.csv')"),
      { operation: 'datasource-preview', adapter: 'duckdb-wasm' },
    );

    const payload = error.mock.calls[0]![1] as { error: { message: string; stack?: string } };
    expect(payload).toEqual(
      expect.objectContaining({ operation: 'datasource-preview', adapter: 'duckdb-wasm' }),
    );
    expect(JSON.stringify(payload)).not.toContain('https://example.com/private.csv');
    expect(JSON.stringify(payload)).not.toContain('read_csv');
    expect(payload.error.message).toContain('[redacted-sql]');
  });
});
