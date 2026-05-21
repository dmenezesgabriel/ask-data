import * as chronoEn from 'chrono-node/en';
import * as chronoPt from 'chrono-node/pt';
import Fuse from 'fuse.js';

import { createLogger } from '../../../shared/observability/logger';
import type {
  AskIntent,
  CatalogField,
  ClarificationPending,
  DateRange,
  DiagnosticDateParse,
  DiagnosticFilterSelectivity,
  DiagnosticJoinFanout,
  Entity,
  FieldFuse,
  IntentFilter,
  ParseOptions,
  PlannedSql,
  Relationship,
  ValueFuse,
  ValueItem,
  Vocabulary,
} from '../../../shared/types/index';
import { fieldKey, norm, toRows } from '../../../shared/utils/utils';
import { CatalogBuilder } from './catalog-builder';
import { DateRangeParser } from './date-range-parser';
import { DiagnosticRunner } from './diagnostic-runner';
import type { Labelable } from './intent-describer';
import { IntentDescriber } from './intent-describer';
import { NarrativeGenerator, type NarrativeResult } from './narrative-generator';
import { QuestionParser } from './question-parser';
import {
  ChartDecisionTree,
  ConfidenceScorer,
  InsightGenerator,
  ResultShapeAnalyzer,
  ResultValidator,
} from './result-analysis';
import { SemanticFieldMatcher } from './semantic-field-matcher';
import { SemanticModelingEngine } from './semantic-modeling';
import { SqlPlanner } from './sql-planner';
import { TermMatcher } from './term-matcher';
import { ValueFilterResolver } from './value-filter-resolver';
import { buildVocabulary } from './vocabulary';

export { CatalogBuilder } from './catalog-builder';
export { DateQuestionText } from './date-question-text';
export {
  ChronoDateParser,
  DateRangeParser,
  ExplicitYearDateParser,
  NamedMonthDateParser,
  RelativePeriodDateParser,
} from './date-range-parser';
export { MonthCatalog } from './month-catalog';
export { QuestionParser } from './question-parser';
export { SemanticFieldMatcher } from './semantic-field-matcher';
export { SqlPlanner } from './sql-planner';
export { TermMatcher } from './term-matcher';
export { ValueFilterResolver } from './value-filter-resolver';
import {
  ExactFieldMatchStrategy,
  FieldResolver,
  FieldSearchIndex,
  FuseFieldMatchStrategy,
  SemanticFieldMatchStrategy,
  TextSearchFieldMatchStrategy,
} from './field-search';
import { IntentCueDetector } from './intent-cue-detector';

export {
  ExactFieldMatchStrategy,
  FieldResolver,
  FieldSearchIndex,
  FuseFieldMatchStrategy,
  SemanticFieldMatchStrategy,
  TextSearchFieldMatchStrategy,
} from './field-search';
export { IntentCueDetector } from './intent-cue-detector';

export class AskDataEngine {
  private readonly logger = createLogger('AskData');
  config: {
    dataSources?: Array<{ name: string }>;
    relationships?: Relationship[];
    askData?: Partial<import('../../../shared/types/index').AskDataConfig>;
  };
  askConfig: Partial<import('../../../shared/types/index').AskDataConfig>;
  duckDBManager: { query: (sql: string) => Promise<unknown> };
  catalog: CatalogField[];
  fieldByKey: Map<string, CatalogField>;
  relationships: Relationship[];
  ambiguousRelationships: Relationship[];
  entities: Entity[];
  fieldFuse: FieldFuse | null;
  fieldSearchIndex: FieldSearchIndex | null;
  valueFuse: ValueFuse | null;
  valueItems: ValueItem[];
  valuePhraseMaxWords: number;
  locale: string;
  localeFamily: string;
  vocabulary: Vocabulary;
  termMatcher: TermMatcher;
  chronoParser: typeof chronoEn | typeof chronoPt;
  dateRangeParser: DateRangeParser;
  intentCues: IntentCueDetector;
  shapeAnalyzer: import('./result-analysis').ResultShapeAnalyzer;
  chartDecisionTree: import('./result-analysis').ChartDecisionTree;
  resultValidator: import('./result-analysis').ResultValidator;
  sqlPlanner: SqlPlanner;
  catalogBuilder: CatalogBuilder;
  confidenceScorer: import('./result-analysis').ConfidenceScorer;
  insightGenerator: import('./result-analysis').InsightGenerator;
  semanticMatcher: SemanticFieldMatcher;
  fieldResolver: FieldResolver;
  filterResolver: ValueFilterResolver;
  metrics: { catalogBuildMs: number | null };
  questionParser: QuestionParser;
  initialized: boolean;
  semanticModelingEngine: SemanticModelingEngine;
  narrativeGenerator: NarrativeGenerator;
  intentDescriber: IntentDescriber;
  diagnosticRunner: DiagnosticRunner;
  autoSemanticEnabled: boolean;
  autoNarrativesEnabled: boolean;

  constructor(config: AskDataEngine['config'], duckDBManager: AskDataEngine['duckDBManager']) {
    this.config = config;
    this.askConfig = config.askData || {};
    this.duckDBManager = duckDBManager;
    this.catalog = [];
    this.fieldByKey = new Map();
    this.relationships = [];
    this.ambiguousRelationships = [];
    this.entities = [];
    this.fieldFuse = null;
    this.fieldSearchIndex = null;
    this.valueFuse = null;
    this.valueItems = [];
    this.valuePhraseMaxWords = 1;
    this.locale = this.resolveLocale();
    this.localeFamily = this.locale.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    this.vocabulary = this.buildVocabulary();
    this.termMatcher = new TermMatcher(this.vocabulary, this.localeFamily);
    this.chronoParser = this.localeFamily === 'pt' ? chronoPt : chronoEn;
    this.dateRangeParser = new DateRangeParser({
      primaryParser: this.chronoParser,
      fallbackParser: this.localeFamily === 'pt' ? chronoEn : chronoPt,
      termMatcher: this.termMatcher,
      locale: this.locale,
    });
    this.intentCues = new IntentCueDetector(this.termMatcher);
    this.shapeAnalyzer = new ResultShapeAnalyzer();
    this.chartDecisionTree = new ChartDecisionTree(this.askConfig.chartCapabilities || {});
    this.resultValidator = new ResultValidator();
    this.sqlPlanner = new SqlPlanner({
      config: this.config,
      askConfig: this.askConfig,
      relationships: () => this.relationships,
      getDefaultTimeField: () => this.getDefaultTimeField(),
    });
    this.catalogBuilder = new CatalogBuilder({
      config: this.config,
      askConfig: this.askConfig,
      duckDBManager: this.duckDBManager,
      fieldByKey: this.fieldByKey,
      displayLabel: (item) => this.displayLabel(item),
      localizedTerms: (item) => this.localizedTerms(item),
      timeSqlExpression: (field, alias) => this.sqlPlanner.timeSqlExpression(field, alias),
    });
    this.confidenceScorer = new ConfidenceScorer({
      config: this.config,
      termMatcher: this.termMatcher,
      displayLabel: (field) => this.displayLabel(field),
      localizedTerms: (field) => this.localizedTerms(field),
      joinPlanProvider: this.sqlPlanner,
    });
    this.insightGenerator = new InsightGenerator();
    this.semanticMatcher = new SemanticFieldMatcher(this.askConfig.semanticMatching || {}, {
      displayLabel: (item) => this.displayLabel(item),
      localizedTerms: (item) => this.localizedTerms(item),
    });
    this.semanticModelingEngine = new SemanticModelingEngine();
    this.autoSemanticEnabled = this.askConfig.autoSemanticModeling !== false;
    this.narrativeGenerator = new NarrativeGenerator();
    this.intentDescriber = new IntentDescriber((item) => this.displayLabel(item));
    this.diagnosticRunner = new DiagnosticRunner((sql) => this.duckDBManager.query(sql));
    this.autoNarrativesEnabled = this.askConfig.autoNarratives !== false;
    this.fieldResolver = new FieldResolver(
      [
        new ExactFieldMatchStrategy({
          catalog: () => this.catalog,
          displayLabel: (field) => this.displayLabel(field),
          localizedTerms: (field) => this.localizedTerms(field),
          termMatcher: this.termMatcher,
        }),
        new TextSearchFieldMatchStrategy({ fieldSearchIndex: () => this.fieldSearchIndex }),
        new FuseFieldMatchStrategy({ fieldFuse: () => this.fieldFuse }),
        new SemanticFieldMatchStrategy({
          semanticMatcher: this.semanticMatcher,
          catalog: () => this.catalog,
        }),
      ],
      (pending, message, fields) => this.fieldClarification(pending, message, fields),
    );
    this.filterResolver = new ValueFilterResolver({
      valueItems: () => this.valueItems,
      valueFuse: () => this.valueFuse,
      valuePhraseMaxWords: () => this.valuePhraseMaxWords,
      displayLabel: (field) => this.displayLabel(field),
      localizedTerms: (field) => this.localizedTerms(field),
    });
    this.metrics = { catalogBuildMs: null };
    this.questionParser = new QuestionParser({
      askConfig: this.askConfig,
      catalog: () => this.catalog,
      entities: () => this.entities,
      termMatcher: this.termMatcher,
      intentCues: this.intentCues,
      filterResolver: this.filterResolver,
      dateRangeParser: this.dateRangeParser,
      localizedTerms: (field) => this.localizedTerms(field),
      resolveFieldPhrase: (phrase, roles, clarification) =>
        this.fieldResolver.resolvePhrase(phrase, roles, clarification),
      findBestFieldInText: (q, role) => this.fieldResolver.findInText(q, role),
      getDefaultMetric: () => this.getDefaultMetric(),
      getDefaultTimeField: () => this.getDefaultTimeField(),
    });
    this.initialized = false;
  }

  resolveLocale() {
    const configured = this.askConfig.locale;
    const browserLocale = typeof navigator !== 'undefined' ? navigator.language : '';
    const locale = configured && configured !== 'auto' ? configured : browserLocale;
    return locale || this.askConfig.locales?.fallback || 'en-US';
  }

  buildVocabulary() {
    return buildVocabulary(this.askConfig.vocabulary);
  }

  terms(group: string) {
    return this.termMatcher.terms(group);
  }

  termAlternation(group: string) {
    return this.termMatcher.alternation(group);
  }

  hasTerm(q: string, group: string) {
    return this.termMatcher.has(q, group);
  }

  localizedMapValue<T>(map: Record<string, T> | null | undefined, fallback: T): T {
    if (!map) return fallback;
    return (
      (map[this.locale] as T | undefined) ||
      (map[this.localeFamily] as T | undefined) ||
      (Object.entries(map).find(([key]) => key.toLowerCase().startsWith(this.localeFamily))?.[1] as
        | T
        | undefined) ||
      fallback
    );
  }

  localizedTerms(item: {
    localizedSynonyms?: Record<string, string[]>;
    localizedTerms?: Record<string, string[]>;
  }): string[] {
    const map = item.localizedSynonyms || item.localizedTerms;
    if (!map) return [];
    const active = this.localizedMapValue(map, [] as string[]);
    const all = Object.values(map).flat().filter(Boolean) as string[];
    return [...new Set([...(Array.isArray(active) ? active : []), ...all])];
  }

  displayLabel(item: Labelable): string {
    return this.localizedMapValue(item.labels ?? {}, item.label || item.column || '') as string;
  }

  async initialize() {
    if (this.initialized) return;
    await this.refreshCatalog();
    this.logger.info('ready', {
      fields: this.catalog.length,
      relationships: this.relationships.length,
      ambiguousRelationships: this.ambiguousRelationships.length,
      catalogBuildMs: this.metrics.catalogBuildMs,
    });
  }

  async refreshCatalog() {
    this.logger.info('catalog.build.start', {
      dataSources: (this.config.dataSources || []).map((source) => source.name),
    });
    const catalogStarted = performance.now();
    await this.buildCatalog();
    this.buildFuseIndexes();
    this.metrics.catalogBuildMs = Math.round(performance.now() - catalogStarted);
    this.initialized = true;
  }

  async buildCatalog() {
    const built = await this.catalogBuilder.build();
    this.catalog = built.catalog;
    this.relationships = built.relationships;
    this.ambiguousRelationships = built.ambiguousRelationships;
    this.entities = built.entities;
  }

  buildFuseIndexes() {
    const fieldItems = this.catalog.map((field) => {
      const activeLabel = this.displayLabel(field);
      const activeSynonyms = this.localizedTerms(field);
      const allSynonyms = [
        ...new Set([
          ...(field.synonyms || []),
          ...Object.values(field.localizedSynonyms || {}).flat(),
        ]),
      ];
      return {
        field,
        text: [activeLabel, field.label, field.column, ...allSynonyms].join(' '),
        activeLabel,
        activeSynonyms,
        label: field.label,
        column: field.column,
        synonyms: field.synonyms || [],
        allSynonyms,
        role: field.role,
      };
    });
    this.fieldFuse = new Fuse(fieldItems, {
      includeScore: true,
      threshold: 0.35,
      keys: [
        { name: 'activeLabel', weight: 0.45 },
        { name: 'activeSynonyms', weight: 0.45 },
        { name: 'label', weight: 0.3 },
        { name: 'column', weight: 0.3 },
        { name: 'synonyms', weight: 0.25 },
        { name: 'allSynonyms', weight: 0.2 },
        { name: 'text', weight: 0.1 },
      ],
    });
    this.fieldSearchIndex = new FieldSearchIndex({
      catalog: () => this.catalog,
      displayLabel: (field) => this.displayLabel(field),
      localizedTerms: (field) => this.localizedTerms(field),
    });
    this.fieldSearchIndex.rebuild();

    this.valueItems = [];
    for (const field of this.catalog.filter((f) => f.role === 'dimension')) {
      for (const value of field.sampleValues || []) {
        const normalizedValue = norm(value);
        if (normalizedValue) this.valueItems.push({ value, normalizedValue, field });
      }
    }
    this.valuePhraseMaxWords = Math.max(
      1,
      ...this.valueItems.map((item) => item.normalizedValue.split(/\s+/).length),
    );
    this.valueFuse = new Fuse(this.valueItems, {
      includeScore: true,
      threshold: 0.2,
      ignoreLocation: true,
      keys: ['normalizedValue', 'value'],
    });
  }

  async ask(question: string, options: ParseOptions = {}) {
    const askSpan = this.logger.span('ask', { question });
    const totalStarted = performance.now();

    try {
      await this.initialize();
      const parseStarted = performance.now();
      const parsed = await this.parseQuestion(question, options);
      const parseMs = Math.round(performance.now() - parseStarted);
      if (parsed.error) {
        const response = {
          ...parsed,
          metrics: {
            catalogBuildMs: this.metrics.catalogBuildMs,
            parseMs,
            totalAskMs: Math.round(performance.now() - totalStarted),
          },
        };
        askSpan.end({ outcome: 'parse-error', metrics: response.metrics }, 'warn');
        return response;
      }
      if (parsed.clarification) {
        const response = {
          ...parsed,
          metrics: {
            catalogBuildMs: this.metrics.catalogBuildMs,
            parseMs,
            totalAskMs: Math.round(performance.now() - totalStarted),
          },
        };
        askSpan.end({ outcome: 'clarification', metrics: response.metrics }, 'info');
        return response;
      }
      const planned = this.planSql(parsed.intent);
      if (planned.error) {
        const response = {
          ...planned,
          metrics: {
            catalogBuildMs: this.metrics.catalogBuildMs,
            parseMs,
            totalAskMs: Math.round(performance.now() - totalStarted),
          },
        };
        askSpan.end({ outcome: 'planning-error', metrics: response.metrics }, 'warn');
        return response;
      }
      this.logger.info('sql.generated', { traceId: askSpan.traceId, sql: planned.sql });
      const sqlStarted = performance.now();
      if (!planned.sql) {
        const response = {
          error: planned.error || 'Failed to generate SQL query',
          metrics: {
            catalogBuildMs: this.metrics.catalogBuildMs,
            parseMs,
            totalAskMs: Math.round(performance.now() - totalStarted),
          },
        };
        askSpan.end({ outcome: 'missing-sql', metrics: response.metrics }, 'error');
        return response;
      }
      const result = await this.duckDBManager.query(planned.sql);
      const sqlExecutionMs = Math.round(performance.now() - sqlStarted);
      const rows = toRows(result).map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]),
        ),
      );
      const columns = rows.length ? Object.keys(rows[0]) : planned.columns;
      const diagnostics = await this.evaluateDiagnostics(planned);
      const shape = this.shapeAnalyzer.analyze(rows, columns, parsed.intent);
      const chartDecision = this.chartDecisionTree.decide(shape, parsed.intent);
      const insights = this.insightGenerator.generate(rows, parsed.intent, shape);
      let narratives: NarrativeResult | null = null;
      if (this.autoNarrativesEnabled && rows.length > 0) {
        try {
          const metricField =
            parsed.intent.metric && 'table' in parsed.intent.metric ? parsed.intent.metric : null;
          narratives = this.narrativeGenerator.generateNarratives(
            rows,
            parsed.intent,
            shape,
            metricField,
          );
        } catch (err) {
          this.logger.warn('narrative.failed', { traceId: askSpan.traceId, error: err });
        }
      }
      const confidence = this.confidenceScorer.estimate(parsed.intent);
      const validationWarnings = this.resultValidator.validate({
        rows,
        intent: parsed.intent,
        confidence,
        diagnostics,
      });
      const evidence = this.describeEvidence(parsed.intent);
      const response = {
        question,
        interpretation: this.describeIntent(parsed.intent),
        intent: parsed.intent,
        sql: planned.sql,
        rows,
        columns,
        shape,
        diagnostics,
        chartDecision,
        insights,
        narratives,
        evidence,
        chartType: chartDecision.rendered,
        warnings: [...(parsed.warnings || []), ...validationWarnings],
        confidence,
        metrics: {
          catalogBuildMs: this.metrics.catalogBuildMs,
          parseMs,
          sqlExecutionMs,
          totalAskMs: Math.round(performance.now() - totalStarted),
        },
      };
      askSpan.end({
        outcome: 'success',
        chartType: response.chartType,
        rowCount: response.rows.length,
        warningCount: response.warnings.length,
        metrics: response.metrics,
      });
      return response;
    } catch (error) {
      askSpan.fail(error);
      throw error;
    }
  }

  parseQuestion(question: string, options: ParseOptions = {}) {
    return this.questionParser.parse(question, options);
  }

  async evaluateJoinFanout(fanout: DiagnosticJoinFanout) {
    return this.diagnosticRunner.evaluateJoinFanout(fanout);
  }

  async evaluateFilterSelectivity(selectivity: DiagnosticFilterSelectivity) {
    return this.diagnosticRunner.evaluateFilterSelectivity(selectivity);
  }

  async evaluateDateParse(dateParse: DiagnosticDateParse) {
    return this.diagnosticRunner.evaluateDateParse(dateParse);
  }

  async evaluateDiagnostics(planned: PlannedSql) {
    return this.diagnosticRunner.evaluateDiagnostics(planned.diagnostics || {});
  }

  fieldClarification(pending: ClarificationPending, message: string, fields: CatalogField[]) {
    const candidates = fields.map((field) => ({
      label: `${this.displayLabel(field)} (${field.table}.${field.column})`,
      fieldId: field.id,
      fieldLabel: this.displayLabel(field),
      table: field.table,
      column: field.column,
    }));
    return {
      clarification: {
        message,
        pending: { ...pending, originalQuestion: null, candidates },
        choices: candidates,
      },
    };
  }

  getDefaultMetric() {
    const explicit = this.askConfig.defaultMetric;
    if (explicit) {
      const field = this.fieldByKey.get(fieldKey(explicit.table, explicit.column));
      if (field) return field;
    }
    const measures = this.catalog.filter((f) => f.role === 'measure');
    return (
      measures.find((f) => f.default) ||
      measures.sort((a, b) => this.measurePriority(b) - this.measurePriority(a))[0] || {
        kind: 'count_star',
        label: 'Records',
      }
    );
  }

  measurePriority(field: CatalogField): number {
    if (field.priority > 0) return 1000 + field.priority;
    const n = norm(field.label + ' ' + field.column);
    const names = [
      'sales',
      'revenue',
      'amount',
      'profit',
      'margin',
      'quantity',
      'count',
      'total',
      'value',
    ];
    const index = names.findIndex((name) => n.includes(name));
    return index >= 0 ? 100 - index : 0;
  }

  getDefaultTimeField() {
    const times = this.catalog.filter((f) => f.role === 'time');
    return (
      times.find((f) => f.default) || times.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0]
    );
  }

  timeSqlExpression(field: CatalogField, alias: string) {
    return this.sqlPlanner.timeSqlExpression(field, alias);
  }

  planSql(intent: AskIntent) {
    return this.sqlPlanner.plan(intent);
  }

  buildJoinPlan(baseTable: string, neededTables: string[]) {
    return this.sqlPlanner.buildJoinPlan(baseTable, neededTables);
  }

  findRelationshipPath(startTables: string[], targetTable: string) {
    return this.sqlPlanner.findRelationshipPath(startTables, targetTable);
  }

  describeMetricPart(intent: AskIntent) {
    return this.intentDescriber.describeMetricPart(intent);
  }

  describeFilterParts(filters: IntentFilter[]) {
    return this.intentDescriber.describeFilterParts(filters);
  }

  describeDatePart(dateRange: DateRange | null | undefined) {
    return this.intentDescriber.describeDatePart(dateRange);
  }

  describeIntent(intent: AskIntent) {
    return this.intentDescriber.describeIntent(intent);
  }

  describeEvidence(intent: AskIntent) {
    return this.intentDescriber.describeEvidence(intent);
  }
}
