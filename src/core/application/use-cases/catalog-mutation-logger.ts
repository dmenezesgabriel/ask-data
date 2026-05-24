import { createLogger } from '@/shared/observability/logger';

type CatalogAssetType = 'datasource' | 'question' | 'dashboard';
type CatalogMutationOperation = 'create' | 'update' | 'delete';

const logger = createLogger('catalog-mutation');

export async function recordCatalogMutation<T>(
  assetType: CatalogAssetType,
  operation: CatalogMutationOperation,
  mutation: () => Promise<T>,
): Promise<T> {
  try {
    const result = await mutation();
    logger.info('mutation', { assetType, operation, result: 'success' });
    return result;
  } catch (error) {
    logger.error('mutation', error, { assetType, operation, result: 'failure' });
    throw error;
  }
}
