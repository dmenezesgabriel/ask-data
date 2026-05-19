import type { AskDataResponse } from '@/core/entities';

export interface AskEngine {
  initialize(): Promise<void>;
  ask(question: string, options?: Record<string, unknown>): Promise<AskDataResponse>;
}
