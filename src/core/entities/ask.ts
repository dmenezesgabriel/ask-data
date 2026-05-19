// Boundary types for the ask use case — defined in shared/types/ask.ts
// to avoid circular imports (AskDataConfig and AskDataResponse reference
// internal engine types that stay in shared).
export type { AskDataConfig, AskDataResponse } from '@/shared/types/ask';
