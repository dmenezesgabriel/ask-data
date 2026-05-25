import { setCatalogService } from '@/shared/services/catalog-service';

import type { AppContainer } from './client-only-container';
import { createClientOnlyContainer } from './client-only-container';
import { createClientServerContainer } from './client-server-container';
import { parseRuntimeMode } from './runtime-mode';

const runtimeMode = parseRuntimeMode(import.meta.env.VITE_RUNTIME_MODE);

if (runtimeMode.warning) {
  console.warn(`[app-container] ${runtimeMode.warning}`);
}

// createClientServerContainer() satisfies AppContainer structurally: it provides all required
// read-only fields and lacks the optional write fields — no cast needed.
export const container: AppContainer =
  runtimeMode.mode === 'client-server'
    ? createClientServerContainer()
    : createClientOnlyContainer();

setCatalogService(container);
