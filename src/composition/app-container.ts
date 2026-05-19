import type { AppContainer } from './client-only-container';
import { createClientOnlyContainer } from './client-only-container';
import { createClientServerContainer } from './client-server-container';

const mode = import.meta.env.VITE_RUNTIME_MODE;

const _container: AppContainer =
  mode === 'client-server'
    ? (createClientServerContainer() as unknown as AppContainer)
    : createClientOnlyContainer();
