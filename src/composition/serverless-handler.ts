import type { ApplicationComposition } from './application-composition';
import { createServerlessComposition } from './serverless-composition';

export type ServerlessCatalogRequest = Readonly<{
  operation: 'datasources.list';
  correlationId?: string;
}>;

export type ServerlessCatalogResponse = Readonly<{
  statusCode: number;
  correlationId?: string;
  body: unknown;
}>;

export async function handleServerlessCatalogRequest(
  request: ServerlessCatalogRequest,
  composition: ApplicationComposition = createServerlessComposition(),
): Promise<ServerlessCatalogResponse> {
  try {
    return {
      statusCode: 200,
      correlationId: request.correlationId,
      body: await composition.catalog.datasources.list.execute(),
    };
  } catch (error) {
    composition.observability.logger.error('serverless.operation.failed', error, {
      operationName: request.operation,
      correlationId: request.correlationId,
    });
    return {
      statusCode: 500,
      correlationId: request.correlationId,
      body: { error: 'Serverless operation failed.' },
    };
  }
}
