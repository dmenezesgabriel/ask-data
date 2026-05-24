import type { Clock, IdGenerator, QuestionRepository } from '@/core/application/ports';
import type { Question } from '@/core/entities';
import { generateUniqueSlug, nameToSlug } from '@/shared/utils/slug';

import { recordCatalogMutation } from '../catalog-mutation-logger';

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
    const existing = await this.questions.list();
    const slug = generateUniqueSlug(nameToSlug(input.title, 'question'), (candidate) =>
      existing.some((question) => question.slug === candidate),
    );
    const question: Question = {
      ...input,
      id: this.idGenerator.create(),
      slug,
      source: input.source ?? 'user',
      createdAt: now,
      updatedAt: now,
    };
    return recordCatalogMutation('question', 'create', async () => {
      await this.questions.save(question);
      return question;
    });
  }
}
