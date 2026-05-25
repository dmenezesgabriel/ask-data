import type {
  AskEngineConfig,
  DataSourceManager,
  QueryEngine,
  QueryPort,
} from '@/core/application/ports';
import type { CapabilityRegistry, CapabilitySnapshot } from '@/core/platform';
import type { AskDataEngine } from '@/features/ask/model/ask-data';
import type { AppLogger } from '@/shared/observability/logger';

export type DeploymentMode = 'client-only' | 'client-server' | 'serverless';

export type OperationCapabilityId =
  | 'catalog.datasources.read'
  | 'catalog.datasources.write'
  | 'catalog.questions.read'
  | 'catalog.questions.write'
  | 'catalog.dashboards.read'
  | 'catalog.dashboards.write'
  | 'query.execute'
  | 'ask-data.execute';

export type OperationCapability = Readonly<{
  id: OperationCapabilityId;
  supported: boolean;
  reason?: string;
}>;

export type ApplicationCapabilitySnapshot = CapabilitySnapshot &
  Readonly<{
    operationCapabilities: readonly OperationCapability[];
  }>;

type UseCase = { execute(...args: unknown[]): Promise<unknown> };

type CatalogReadUseCases = Readonly<{
  get: UseCase;
  list: UseCase;
}>;

type DatasourceWriteUseCases = Readonly<{
  create: UseCase;
  update: UseCase;
  delete: UseCase;
}>;

export type SupportedOperations<TUseCases> = Readonly<{
  supported: true;
  capabilityId: OperationCapabilityId;
  useCases: TUseCases;
}>;

export type UnsupportedOperations = Readonly<{
  supported: false;
  capabilityId: OperationCapabilityId;
  reason: string;
}>;

export type OperationSupport<TUseCases> = SupportedOperations<TUseCases> | UnsupportedOperations;

export type ApplicationComposition = Readonly<{
  deploymentMode: DeploymentMode;
  platformRegistry: CapabilityRegistry;
  capabilitySnapshot: ApplicationCapabilitySnapshot;
  queryEngine: QueryEngine;
  queryPort: QueryPort;
  queryAdapterName: string;
  dataSourceManager: DataSourceManager;
  createAskEngine(config: AskEngineConfig): AskDataEngine;
  catalog: Readonly<{
    datasources: CatalogReadUseCases & {
      mutations: OperationSupport<DatasourceWriteUseCases>;
    };
    questions: CatalogReadUseCases & {
      mutations: OperationSupport<DatasourceWriteUseCases>;
    };
    dashboards: CatalogReadUseCases & {
      mutations: OperationSupport<DatasourceWriteUseCases>;
    };
  }>;
  observability: Readonly<{
    logger: AppLogger;
    logStartup(): void;
  }>;
}>;

export function supportedOperations<TUseCases>(
  capabilityId: OperationCapabilityId,
  useCases: TUseCases,
): SupportedOperations<TUseCases> {
  return { supported: true, capabilityId, useCases };
}

export function unsupportedOperations(
  capabilityId: OperationCapabilityId,
  reason: string,
): UnsupportedOperations {
  return { supported: false, capabilityId, reason };
}

export function isSupportedOperations<TUseCases>(
  support: OperationSupport<TUseCases>,
): support is SupportedOperations<TUseCases> {
  return support.supported;
}

export function createApplicationCapabilitySnapshot(
  platformSnapshot: CapabilitySnapshot,
  operationCapabilities: readonly OperationCapability[],
): ApplicationCapabilitySnapshot {
  return Object.freeze({
    capabilities: platformSnapshot.capabilities,
    operationCapabilities: Object.freeze([...operationCapabilities]),
  });
}

export function hasOperationCapability(
  snapshot: ApplicationCapabilitySnapshot,
  capabilityId: OperationCapabilityId,
): boolean {
  return snapshot.operationCapabilities.some(
    (capability) => capability.id === capabilityId && capability.supported,
  );
}

export function createOperationCapabilities(
  supportsWrites: boolean,
  unsupportedWriteReason = 'This deployment mode exposes catalog reads through its adapter boundary.',
): readonly OperationCapability[] {
  const readAndExecuteCapabilities: OperationCapability[] = [
    { id: 'catalog.datasources.read', supported: true },
    { id: 'catalog.questions.read', supported: true },
    { id: 'catalog.dashboards.read', supported: true },
    { id: 'query.execute', supported: true },
    { id: 'ask-data.execute', supported: true },
  ];
  const writeCapabilities: OperationCapability[] = [
    'catalog.datasources.write',
    'catalog.questions.write',
    'catalog.dashboards.write',
  ].map((id) =>
    supportsWrites
      ? { id: id as OperationCapabilityId, supported: true }
      : { id: id as OperationCapabilityId, supported: false, reason: unsupportedWriteReason },
  );

  return Object.freeze([...readAndExecuteCapabilities, ...writeCapabilities]);
}

export function logCompositionStartup(composition: ApplicationComposition): void {
  composition.observability.logger.info('composition.startup', {
    deploymentMode: composition.deploymentMode,
    enabledCapabilityIds: composition.capabilitySnapshot.capabilities.map(
      (capability) => capability.id,
    ),
    supportedOperationCapabilityIds: composition.capabilitySnapshot.operationCapabilities
      .filter((capability) => capability.supported)
      .map((capability) => capability.id),
  });
}
