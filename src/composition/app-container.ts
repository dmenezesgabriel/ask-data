import type { AppContainer } from './client-only-container';
import { createClientOnlyContainer } from './client-only-container';
import { createClientServerContainer } from './client-server-container';

const mode = import.meta.env.VITE_RUNTIME_MODE;

if (mode && mode !== 'client-only' && mode !== 'client-server') {
  // cast: TypeScript narrows mode to never after the !== guards; the cast is correct at runtime
  // because env values are plain strings regardless of the declared union type.
  console.warn(
    `[app-container] Unrecognised VITE_RUNTIME_MODE "${mode as string}"; defaulting to client-only.`,
  );
}

// createClientServerContainer() satisfies AppContainer structurally: it provides all required
// read-only fields and lacks the optional write fields — no cast needed.
export const container: AppContainer =
  mode === 'client-server' ? createClientServerContainer() : createClientOnlyContainer();
