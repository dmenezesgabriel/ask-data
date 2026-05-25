import type Fuse from 'fuse.js';
import type MiniSearch from 'minisearch';

/**
 * @deprecated Stable Ask Data and Semantic Model contracts now live in
 * `@/core/entities/ask`. Import from the core contract directly when touching
 * call sites. These compatibility types remain only for incremental migration.
 */
export type AskChartType =
  | 'kpi'
  | 'table'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'histogram';

/** @deprecated Import from `@/core/entities/ask`. */
export type AnalysisType =
  | 'list_values'
  | 'yoy'
  | 'change'
  | 'share'
  | 'comparison'
  | 'trend'
  | 'ranking'
  | 'kpi';

/** @deprecated Import from `@/core/entities/ask`. */
export type ValueFormat = 'currency' | 'percent' | string | undefined;
/** @deprecated Import from `@/core/entities/ask`. */
export type FieldRole = 'measure' | 'time' | 'dimension' | 'key';

/** @deprecated Import from `@/core/entities/ask`. */
export interface SourceColumnRef {
  table: string;
  column: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface SemanticMatchingConfig {
  enabled?: boolean;
  model?: string;
  dtype?: string;
  minScore?: number;
  minMargin?: number;
  batchSize?: number;
}

/** @deprecated Import from `@/core/entities/ask`. */
export type Vocabulary = Record<string, Record<string, string[]>>;

/** @deprecated Import from `@/core/entities/ask`. */
export interface FieldConfig {
  table: string;
  column: string;
  role?: FieldRole;
  aggregation?: string;
  label?: string;
  labels?: Record<string, string>;
  synonyms?: string[];
  localizedSynonyms?: Record<string, string[]>;
  description?: string;
  format?: ValueFormat;
  default?: boolean;
  priority?: number;
  parseFormat?: string | null;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface EntityConfig {
  label: string;
  labels?: Record<string, string>;
  singular: string;
  table: string;
  key: string;
  synonyms?: string[];
  localizedTerms?: Record<string, string[]>;
  preferredDimensions?: string[];
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface RelationshipSide {
  table: string;
  column: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface Relationship {
  left: RelationshipSide;
  right: RelationshipSide;
  confidence?: number;
  inferred?: boolean;
  overlap?: number;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskDataConfig {
  enabled?: boolean;
  locale?: string;
  locales?: { supported?: string[]; fallback?: string };
  defaultQuestion: string;
  maxRows?: number;
  maxDimensions?: number;
  maxMetrics?: number;
  inferRelationships?: boolean;
  semanticMatching?: SemanticMatchingConfig;
  autoSemanticModeling?: boolean;
  autoNarratives?: boolean;
  profiling?: { maxDistinctValuesPerField?: number; maxSampleRows?: number };
  relationshipInference?: {
    autoAcceptThreshold?: number;
    ambiguousThreshold?: number;
    sampleSize?: number;
  };
  validation?: {
    joinFanoutRatio?: number;
    joinFanoutMinExtraRows?: number;
    filterSelectivityRatio?: number;
  };
  defaultMetric?: SourceColumnRef & { aggregation?: string };
  chartCapabilities?: Partial<Record<AskChartType, boolean>>;
  fields?: FieldConfig[];
  entities?: EntityConfig[];
  examples?: string[];
  vocabulary?: Vocabulary;
  relationships?: Relationship[];
}

/** @deprecated Import from `@/core/entities/ask`. */
export type Filters = Record<string, string>;
/** @deprecated Import from `@/core/entities/ask`. */
export type PrimitiveCell = string | number | bigint | boolean | Date | null | undefined;
/** @deprecated Import from `@/core/entities/ask`. */
export type CellValue = PrimitiveCell | Record<string, unknown> | unknown[];
/** @deprecated Import from `@/core/entities/ask`. */
export type DataRow = Record<string, CellValue>;
/** @deprecated Import from `@/core/entities/ask`. */
export type SortDirection = 'ASC' | 'DESC';

/** @deprecated Import from `@/core/entities/ask`. */
export interface DateProfile {
  minDate: string;
  maxDate: string;
  latestMonthStart: string;
  latestMonthEnd: string;
  latestYearStart: string;
  latestYearEnd: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface CatalogField extends Required<
  Omit<FieldConfig, 'role' | 'aggregation' | 'format' | 'default' | 'parseFormat'>
> {
  id: string;
  type: string;
  role: FieldRole;
  aggregation?: string;
  format?: ValueFormat;
  default: boolean;
  priority: number;
  parseFormat?: string | null;
  sampleValues: string[];
  samples: CellValue[];
  dateProfile: DateProfile | null;
  cardinality: number;
  rowCount: number;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface CountStarMetric {
  kind: 'count_star';
  label: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface CountDistinctMetric {
  kind: 'count_distinct';
  entity: Entity;
  field: CatalogField;
  label: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface Entity extends EntityConfig {
  field: CatalogField;
  terms: string[];
  preferredDimensionFields?: CatalogField[];
}

/** @deprecated Import from `@/core/entities/ask`. */
export type IntentMetric = CatalogField | CountStarMetric | CountDistinctMetric | null;

/** @deprecated Import from `@/core/entities/ask`. */
export interface IntentFilter {
  field: CatalogField;
  operator?: '=' | 'IN';
  value?: CellValue;
  values?: CellValue[];
  score?: number;
  source?: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export type DateRange =
  | { field: CatalogField; start: string; end: string; text: string; kind?: undefined }
  | {
      field: CatalogField;
      kind: 'monthOfYear';
      month: number;
      text: string;
      start?: undefined;
      end?: undefined;
    };

/** @deprecated Import from `@/core/entities/ask`. */
export interface ChangeSpec {
  startYear: number;
  endYear: number;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskIntent {
  question: string;
  analysisType: AnalysisType;
  metric: IntentMetric;
  timeField?: CatalogField | null;
  dimensions: CatalogField[];
  filters: IntentFilter[];
  dateRange?: DateRange | null;
  change?: ChangeSpec | null;
  shareValues?: CellValue[] | null;
  sort?: { by: string; direction: SortDirection };
  limit?: number;
  timeGrain?: 'day' | 'month' | 'year';
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface ResultShape {
  columns: string[];
  rowCount: number;
  numeric: string[];
  categoric: string[];
  time: string[];
  numericCount: number;
  categoricCount: number;
  timeCount: number;
  seriesCount: number;
  groupCount: number;
  hasMetric: boolean;
  oneObservationPerGroup: boolean;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface ChartDecision {
  path: string[];
  recommended: AskChartType | string;
  rendered: AskChartType;
  alternatives: string[];
  reason: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface DiagnosticJoinFanout {
  baseTable?: string;
  joinedTables?: string[];
  baseCountSql?: string;
  joinedCountSql?: string;
  threshold?: number;
  minExtraRows?: number;
  baseCount?: number;
  joinedCount?: number;
  ratio?: number;
  warning?: string;
  error?: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface DiagnosticFilterSelectivity {
  unfilteredCountSql?: string;
  filteredCountSql?: string;
  threshold?: number;
  unfilteredCount?: number;
  filteredCount?: number;
  ratio?: number;
  warning?: string;
  error?: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface DiagnosticDateParse {
  field?: string;
  sql?: string;
  checkedRows?: number;
  droppedRows?: number;
  warning?: string;
  error?: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface Diagnostics {
  joinFanout?: DiagnosticJoinFanout;
  filterSelectivity?: DiagnosticFilterSelectivity;
  dateParse?: DiagnosticDateParse;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface EvidenceItem {
  kind: 'metric' | 'dimension' | 'filter' | 'date';
  field: string;
  table?: string;
  column?: string;
  value?: CellValue;
  source: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskMetrics {
  catalogBuildMs: number | null;
  parseMs?: number;
  sqlExecutionMs?: number;
  totalAskMs?: number;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface ClarificationChoice {
  label: string;
  fieldId: string;
  fieldLabel?: string;
  table?: string;
  column?: string;
  value?: CellValue;
  valueNormalized?: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface ClarificationPending {
  slot: 'field' | 'filterField';
  originalQuestion: string | null;
  phrase?: string;
  roles?: FieldRole[];
  fieldId?: string;
  value?: CellValue;
  valueNormalized?: string;
  candidates?: ClarificationChoice[];
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface Clarification {
  message: string;
  pending: ClarificationPending;
  choices: ClarificationChoice[];
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface Narrative {
  type: 'trend' | 'outlier' | 'pattern' | 'comparison' | 'distribution' | 'summary';
  title: string;
  text: string;
  importance: number;
  details?: Record<string, unknown>;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface NarrativeResult {
  narratives: Narrative[];
  summary: string;
  keyTakeaway: string;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskSuccessResult {
  question: string;
  interpretation: string;
  intent: AskIntent;
  sql: string;
  rows: DataRow[];
  columns: string[];
  shape: ResultShape;
  diagnostics: Diagnostics;
  chartDecision: ChartDecision;
  insights: string[];
  narratives?: NarrativeResult | null;
  evidence: EvidenceItem[];
  chartType: AskChartType;
  warnings: string[];
  confidence: number;
  metrics: AskMetrics;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskErrorResult {
  error: string;
  suggestions?: string[];
  metrics?: AskMetrics;
}

/** @deprecated Import from `@/core/entities/ask`. */
export interface AskClarificationResult {
  clarification: Clarification;
  metrics?: AskMetrics;
}

/** @deprecated Import from `@/core/entities/ask`. */
export type AskDataResponse = AskSuccessResult | AskErrorResult | AskClarificationResult;

/** @deprecated Import from `@/core/entities/ask`. */
export interface ParseOptions {
  clarification?: ClarificationPending;
}

// Internal engine types below remain adapter/implementation details.
export interface PlannedSql {
  sql?: string;
  columns?: string[];
  metricFormat?: ValueFormat;
  diagnostics?: Diagnostics | null;
  error?: string;
}

export interface JoinPlanResult {
  error?: string;
  joins?: Relationship[];
}

export interface JoinPlanProvider {
  buildJoinPlan(baseTable: string, neededTables: string[]): JoinPlanResult;
}

export type WhereCondition =
  | { kind: 'eq'; tableAlias: string; column: string; value: CellValue; fieldType?: string }
  | { kind: 'in'; tableAlias: string; column: string; values: CellValue[] }
  | { kind: 'date_range'; dateExpr: string; start: string; end: string }
  | { kind: 'month_of_year'; dateExpr: string; month: number };

export interface FieldSearchItem {
  field: CatalogField;
  text: string;
  activeLabel: string;
  activeSynonyms: string[];
  label: string;
  column: string;
  synonyms: string[];
  allSynonyms: string[];
  role: FieldRole;
}

export interface ValueItem {
  value: string;
  normalizedValue: string;
  field: CatalogField;
  matchScore?: number;
  matchSource?: string;
}

export type FieldFuse = Fuse<FieldSearchItem>;
export type ValueFuse = Fuse<ValueItem>;
export type FieldSearchIndexType = MiniSearch<{ id: string; role: FieldRole; text: string }>;
