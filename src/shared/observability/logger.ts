export type LogLevelName = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;

declare global {
  var __ASK_DATA_LOG_LEVEL__: LogLevelName | undefined;
}

const LOG_LEVEL_PRIORITY: Record<LogLevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LOG_LEVEL_STORAGE_KEY = 'ask-data:log-level';
const DEFAULT_LOG_LEVEL: LogLevelName = 'info';
let traceSequence = 0;

function isLogLevelName(value: string | null | undefined): value is LogLevelName {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error';
}

function readConfiguredLogLevel(): LogLevelName {
  const fromGlobal = globalThis.__ASK_DATA_LOG_LEVEL__;
  if (fromGlobal) return fromGlobal;

  if (typeof window !== 'undefined') {
    const fromStorage = window.localStorage.getItem(LOG_LEVEL_STORAGE_KEY);
    if (isLogLevelName(fromStorage)) return fromStorage;
  }

  return DEFAULT_LOG_LEVEL;
}

function shouldLog(level: LogLevelName): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[readConfiguredLogLevel()];
}

function serializeError(error: unknown): LogMetadata {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactSensitiveText(error.message),
      stack: error.stack ? redactSensitiveText(error.stack) : undefined,
    };
  }

  return { value: typeof error === 'string' ? redactSensitiveText(error) : error };
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s'"),]+/gi, '[redacted-url]')
    .replace(/\b(?:SELECT|WITH|DESCRIBE|INSERT|UPDATE|DELETE)\b[\s\S]*/gi, '[redacted-sql]');
}

function normalizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      key === 'error' && value instanceof Error ? serializeError(value) : value,
    ]),
  );
}

function emit(level: LogLevelName, scope: string, event: string, metadata?: LogMetadata): void {
  if (!shouldLog(level)) return;

  const message = `[${scope}] ${event}`;
  const payload = normalizeMetadata(metadata);
  const sink = console[level] ?? console.log;

  if (payload) {
    sink(message, payload);
    return;
  }

  sink(message);
}

function createTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  traceSequence += 1;
  return `${Date.now()}-${traceSequence}`;
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export function summarizeSql(sql: string, maxLength = 240): string {
  const normalized = normalizeSql(sql);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

export class AppLogger {
  constructor(private readonly scope: string) {}

  debug(event: string, metadata?: LogMetadata): void {
    emit('debug', this.scope, event, metadata);
  }

  info(event: string, metadata?: LogMetadata): void {
    emit('info', this.scope, event, metadata);
  }

  warn(event: string, metadata?: LogMetadata): void {
    emit('warn', this.scope, event, metadata);
  }

  error(event: string, errorOrMetadata?: unknown, metadata?: LogMetadata): void {
    if (errorOrMetadata instanceof Error) {
      emit('error', this.scope, event, { ...metadata, error: serializeError(errorOrMetadata) });
      return;
    }

    if (errorOrMetadata !== undefined) {
      emit('error', this.scope, event, {
        ...(metadata || {}),
        ...(typeof errorOrMetadata === 'object' && errorOrMetadata !== null
          ? (errorOrMetadata as LogMetadata)
          : { value: errorOrMetadata }),
      });
      return;
    }

    emit('error', this.scope, event, metadata);
  }

  span(event: string, metadata?: LogMetadata): LogSpan {
    return new LogSpan(this, event, metadata);
  }
}

export class LogSpan {
  readonly traceId: string;
  private readonly startedAt: number;

  constructor(
    private readonly logger: AppLogger,
    private readonly event: string,
    private readonly metadata?: LogMetadata,
  ) {
    this.traceId = createTraceId();
    this.startedAt = performance.now();
    this.logger.debug(`${this.event}.start`, { traceId: this.traceId, ...this.metadata });
  }

  end(metadata?: LogMetadata, level: LogLevelName = 'info'): void {
    const payload = {
      traceId: this.traceId,
      durationMs: Math.round(performance.now() - this.startedAt),
      ...this.metadata,
      ...metadata,
    };
    this.logger[level](`${this.event}.ok`, payload);
  }

  fail(error: unknown, metadata?: LogMetadata): void {
    this.logger.error(`${this.event}.error`, error, {
      traceId: this.traceId,
      durationMs: Math.round(performance.now() - this.startedAt),
      ...this.metadata,
      ...metadata,
    });
  }
}

export function createLogger(scope: string): AppLogger {
  return new AppLogger(scope);
}
