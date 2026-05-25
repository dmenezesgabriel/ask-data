import { describe, expect, it } from 'vitest';

import {
  createApplicationCapabilitySnapshot,
  createOperationCapabilities,
  hasOperationCapability,
  isSupportedOperations,
  supportedOperations,
  unsupportedOperations,
} from './application-composition';
import { parseRuntimeMode } from './runtime-mode';

describe('ApplicationComposition capability helpers', () => {
  it('UT-001: distinguishes supported and unsupported operation capabilities', () => {
    const supported = supportedOperations('catalog.datasources.write', { create: 'use-case' });
    const unsupported = unsupportedOperations(
      'catalog.datasources.write',
      'HTTP write adapter is not composed.',
    );
    const snapshot = createApplicationCapabilitySnapshot(
      { capabilities: [] },
      createOperationCapabilities(false, 'HTTP write adapter is not composed.'),
    );

    expect(isSupportedOperations(supported)).toBe(true);
    expect(isSupportedOperations(unsupported)).toBe(false);
    expect(hasOperationCapability(snapshot, 'catalog.datasources.read')).toBe(true);
    expect(hasOperationCapability(snapshot, 'catalog.datasources.write')).toBe(false);
    expect(snapshot.operationCapabilities).toContainEqual({
      id: 'catalog.datasources.write',
      supported: false,
      reason: 'HTTP write adapter is not composed.',
    });
  });

  it('UT-002: parses known and unknown runtime modes deterministically', () => {
    expect(parseRuntimeMode(undefined)).toEqual({ mode: 'client-only', defaulted: false });
    expect(parseRuntimeMode('client-server')).toEqual({
      mode: 'client-server',
      defaulted: false,
    });
    expect(parseRuntimeMode('serverless')).toEqual({ mode: 'serverless', defaulted: false });
    expect(parseRuntimeMode('microservice')).toEqual({
      mode: 'client-only',
      defaulted: true,
      warning: 'Unrecognised VITE_RUNTIME_MODE "microservice"; defaulting to client-only.',
    });
  });
});
