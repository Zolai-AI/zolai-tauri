/**
 * Typed shapes for zolai-core REST responses.
 *
 * Run-script endpoints are intentionally schemaless — the desktop router shells
 * out to independent scripts — so their payloads are `Record<string, unknown>`.
 */

// ---- Health ---------------------------------------------------------------
export interface HealthResponse {
  status: string
  version?: string
  data_root?: string
  database_size_mb?: number
  trained_on?: string
  last_updated?: string
  [key: string]: unknown
}

// ---- Stats ----------------------------------------------------------------
export interface DictionaryStats {
  total: number
  coverage_myanmar_pct?: number
  coverage_missing?: number
}

export interface BibleStats {
  total_verses: number
}

export interface TrainingStats {
  translation_pairs: number
  training_exercises: number
  vocabulary_entries: number
  phrases: number
  grammar_patterns: number
  proverbs: number
  word_alignments: number
  word_usage_profiles: number
}

export interface ProvenanceStats {
  audit_log_entries: number
}

export interface StatsResponse {
  total_tables: number
  total_rows: number
  database_size_mb: number
  dictionary: DictionaryStats
  bible: BibleStats
  training: TrainingStats
  provenance: ProvenanceStats
  table_details?: Record<string, number>
  [key: string]: unknown
}

// ---- Tables ---------------------------------------------------------------
export interface TableRow {
  name: string
  rows: number
}

export interface TablesResponse {
  tables: TableRow[]
  total: number
  [key: string]: unknown
}

// ---- Query ----------------------------------------------------------------
export interface QueryResponse {
  columns: string[]
  rows: Array<Record<string, unknown>>
  count: number
  [key: string]: unknown
}

// ---- Dictionary -----------------------------------------------------------
export interface DictEntry {
  zolai?: string
  word?: string
  english?: string
  myanmar?: string
  pos?: string
  source?: string
  key?: string
  [key: string]: unknown
}

export interface DictSearchResponse {
  results: DictEntry[]
  count: number
  [key: string]: unknown
}

export interface DictDenormalized {
  query?: string
  results?: DictEntry[]
  count?: number
  columns?: string[]
  rows?: Array<Record<string, unknown>>
  [key: string]: unknown
}

// ---- Bible ----------------------------------------------------------------
export interface BibleVerseResult {
  book?: string
  chapter?: number
  verse?: number
  en?: string
  zo?: string
  [key: string]: unknown
}

export interface BibleSearchResponse {
  query?: string
  version?: string
  count?: number
  results?: BibleVerseResult[]
  [key: string]: unknown
}

// ---- Monitor --------------------------------------------------------------
export interface MonitorHealthResponse {
  status?: string
  database_size_mb?: number
  table_count?: number
  tables?: Array<Record<string, unknown>>
  wal_mode?: boolean
  busy_timeout?: number
  [key: string]: unknown
}

export interface CoverageResponse {
  total?: number
  covered?: number
  coverage_pct?: number
  [key: string]: unknown
}

export interface AuditEntry {
  id: number
  table_name: string
  row_id: number
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  reason: string
  // Derived fields for display
  action?: 'created' | 'updated' | 'deleted'
  entity?: string
  detail?: string
}

// ---- Run-script result ----------------------------------------------------
export type RunScriptResult =
  | { success: true; output?: string }
  | { success: false; error: string }
  | { output?: string }
  | { error: string }

// ---- Chat -----------------------------------------------------------------
export interface ChatZolaiResponse {
  zolai_response: string
  english_gloss?: string
  vocabulary?: string[]
  zvs_compliant?: boolean
  context_source?: string
  [key: string]: unknown
}

export interface ChatMessageRole {
  role: 'user' | 'assistant' | 'system'
  content: string
}