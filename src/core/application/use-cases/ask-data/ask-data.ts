import type { AskEngine } from '@/core/application/ports';
import type { AskDataResponse } from '@/core/entities';

export type AskDataInput = {
  question: string;
  datasourceId?: string;
  options?: Record<string, unknown>;
};

export class AskData {
  private initialized = false;

  constructor(private readonly engine: AskEngine) {}

  async execute(input: AskDataInput): Promise<AskDataResponse> {
    if (!this.initialized) {
      await this.engine.initialize();
      this.initialized = true;
    }
    const options = {
      ...(input.options ?? {}),
      ...(input.datasourceId ? { datasourceId: input.datasourceId } : {}),
    };
    return this.engine.ask(input.question, options);
  }
}
