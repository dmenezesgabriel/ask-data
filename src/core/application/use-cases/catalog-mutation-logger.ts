type CatalogAssetType = 'datasource' | 'question' | 'dashboard';
type CatalogMutationOperation = 'create' | 'update' | 'delete';
type LogMetadata = Record<string, unknown>;

function redactSensitiveText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s'"),]+/gi, '[redacted-url]')
    .replace(/\b(?:SELECT|WITH|DESCRIBE|INSERT|UPDATE|DELETE)\b[\s\S]*/gi, '[redacted-sql]');
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

export async function recordCatalogMutation<T>(
  assetType: CatalogAssetType,
  operation: CatalogMutationOperation,
  mutation: () => Promise<T>,
): Promise<T> {
  try {
    const result = await mutation();
    console.info('[catalog-mutation] mutation', { assetType, operation, result: 'success' });
    return result;
  } catch (error) {
    console.error('[catalog-mutation] mutation', {
      assetType,
      operation,
      result: 'failure',
      error: serializeError(error),
    });
    throw error;
  }
}
