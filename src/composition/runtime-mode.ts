import type { DeploymentMode } from './application-composition';

export type RuntimeModeParseResult = Readonly<{
  mode: DeploymentMode;
  defaulted: boolean;
  warning?: string;
}>;

const DEFAULT_RUNTIME_MODE: DeploymentMode = 'client-only';

export function parseRuntimeMode(value: string | undefined): RuntimeModeParseResult {
  if (!value) return { mode: DEFAULT_RUNTIME_MODE, defaulted: false };
  if (value === 'client-only' || value === 'client-server' || value === 'serverless') {
    return { mode: value, defaulted: false };
  }

  return {
    mode: DEFAULT_RUNTIME_MODE,
    defaulted: true,
    warning: `Unrecognised VITE_RUNTIME_MODE "${value}"; defaulting to ${DEFAULT_RUNTIME_MODE}.`,
  };
}
