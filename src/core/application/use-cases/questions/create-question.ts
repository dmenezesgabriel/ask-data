import type { Clock, IdGenerator, QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';

export type CreateQuestionInput = {
  title: string;
  type: Question['type'];
  description?: string;
  chartType?: Question['chartType'];
  query?: string;
  nlQuery?: string;
  queryType?: 'nl' | 'sql';
  columns?: string[];
  columnFormats?: Record<string, string>;
  options?: Record<string, unknown>;
  dataSourceSlugs?: string[];
  source?: 'yaml' | 'user';
};

export class CreateQuestion {
  constructor(
    private readonly questions: QuestionRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateQuestionInput): Promise<Question> {
    const now = this.clock.now();
    const question: Question = {
      ...input,
      id: this.idGenerator.create(),
      slug: input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      source: input.source ?? 'user',
      createdAt: now,
      updatedAt: now,
    };
    await this.questions.save(question);
    return question;
  }
}
