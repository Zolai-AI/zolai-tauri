/**
 * react-query hooks wrapping the typed zolai-core client.
 * Query hooks read data; mutation hooks run side-effecting scripts / CRUD.
 */
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import * as client from './client'
import { ROUTES, type ExportDataType } from './contract'
import type {
  AuditEntry,
  BibleSearchResponse,
  ChatZolaiResponse,
  CoverageResponse,
  DictDenormalized,
  DictEntry,
  DictSearchResponse,
  HealthResponse,
  MonitorHealthResponse,
  QueryResponse,
  RunScriptResult,
  StatsResponse,
  TablesResponse,
} from './types'

// ---- query key factories ---------------------------------------------------
const QK = {
  health: ['health'] as const,
  stats: ['stats'] as const,
  tables: ['tables'] as const,
  monitorHealth: ['monitor', 'health'] as const,
  monitorCoverage: ['monitor', 'coverage'] as const,
  monitorAudit: (limit: number) => ['monitor', 'audit', limit] as const,
  dictSearch: (q: string, limit: number) => ['dict', 'search', q, limit] as const,
  dictBrowse: (limit: number) => ['dict', 'browse', limit] as const,
  dictMySearch: (q: string) => ['dict', 'my', q] as const,
  bibleSearch: (q: string, version: string, limit: number) =>
    ['bible', 'search', q, version, limit] as const,
  auditRecent: ['audit', 'recent'] as const,
}

const defaultQueryOptions = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
}

// ---- health ----------------------------------------------------------------
export function useHealth(): UseQueryResult<HealthResponse, Error> {
  return useQuery({ queryKey: QK.health, queryFn: () => client.getJson<HealthResponse>(ROUTES.health.path), ...defaultQueryOptions })
}

// ---- dashboard / stats -----------------------------------------------------
export function useStats(): UseQueryResult<StatsResponse, Error> {
  return useQuery({ queryKey: QK.stats, queryFn: () => client.getJson<StatsResponse>(ROUTES.stats.path), ...defaultQueryOptions })
}

export function useTables(): UseQueryResult<TablesResponse, Error> {
  return useQuery({ queryKey: QK.tables, queryFn: () => client.getJson<TablesResponse>(ROUTES.tables.path), ...defaultQueryOptions })
}

/** GET /desktop/query — always run ad hoc, not cached by default. */
export function useRunQuery(sql: string | null): UseQueryResult<QueryResponse, Error> {
  return useQuery({
    queryKey: ['query', sql],
    queryFn: () => client.getJson<QueryResponse>(ROUTES.query.path, { sql: sql ?? '' }),
    enabled: !!sql,
    ...defaultQueryOptions,
  })
}

// ---- monitor ---------------------------------------------------------------
export function useMonitorHealth(): UseQueryResult<MonitorHealthResponse, Error> {
  return useQuery({ queryKey: QK.monitorHealth, queryFn: () => client.getJson<MonitorHealthResponse>(ROUTES.monitorHealth.path), ...defaultQueryOptions })
}

export function useMonitorCoverage(): UseQueryResult<CoverageResponse, Error> {
  return useQuery({ queryKey: QK.monitorCoverage, queryFn: () => client.getJson<CoverageResponse>(ROUTES.monitorCoverage.path), ...defaultQueryOptions })
}

export function useMonitorAudit(limit = 50): UseQueryResult<AuditEntry[], Error> {
  return useQuery({
    queryKey: QK.monitorAudit(limit),
    queryFn: () => client.getJson<AuditEntry[]>(ROUTES.monitorAudit.path, { limit }),
    ...defaultQueryOptions,
  })
}

export function useAuditRecent(): UseQueryResult<RunScriptResult, Error> {
  return useQuery({ queryKey: QK.auditRecent, queryFn: () => client.getJson<RunScriptResult>(ROUTES.auditRecent.path), ...defaultQueryOptions })
}

// ---- dictionary ------------------------------------------------------------
export function useDictSearch(query: string, limit = 20): UseQueryResult<DictSearchResponse, Error> {
  return useQuery({
    queryKey: QK.dictSearch(query, limit),
    queryFn: () => client.getJson<DictSearchResponse>(ROUTES.dictSearchAll.path, { q: query, limit }),
    enabled: query.length > 0,
    ...defaultQueryOptions,
  })
}

export function useDictBrowse(limit = 50): UseQueryResult<DictDenormalized, Error> {
  return useQuery({
    queryKey: QK.dictBrowse(limit),
    queryFn: () => client.getJson<DictDenormalized>(ROUTES.dictBrowse.path, { limit }),
    ...defaultQueryOptions,
  })
}

export function useMyanmarSearch(query: string): UseQueryResult<DictDenormalized, Error> {
  return useQuery({
    queryKey: QK.dictMySearch(query),
    queryFn: () => client.getJson<DictDenormalized>(ROUTES.dictSearchMy.path, { q: query }),
    enabled: query.length > 0,
    ...defaultQueryOptions,
  })
}

export function useNonZolaiCheck(): UseQueryResult<RunScriptResult, Error> {
  return useQuery({
    queryKey: ['dict', 'non-zolai'],
    queryFn: () => client.getJson<RunScriptResult>(ROUTES.dictNonZolai.path),
    ...defaultQueryOptions,
  })
}

export interface AddDictInput {
  word: string
  english: string
  myanmar: string
  pos: string
}

export function useAddDict(): UseMutationResult<DictEntry, Error, AddDictInput> {
  return useMutation({
    mutationFn: (input) =>
      client.postJson<DictEntry>(ROUTES.dictAdd.path, input), // body
  })
}

export interface UpdateDictInput {
  word: string
  field: string
  value: string
}

export function useUpdateDict(): UseMutationResult<DictEntry, Error, UpdateDictInput> {
  return useMutation({
    mutationFn: (input) =>
      client.putJson<DictEntry>(ROUTES.dictUpdate.path, undefined, {
        word: input.word,
        field: input.field,
        value: input.value,
      }),
  })
}

export function useDeleteDict(): UseMutationResult<DictEntry, Error, string> {
  return useMutation({
    mutationFn: (word) => client.deleteJson<DictEntry>(ROUTES.dictDelete.path, { word }),
  })
}

// ---- bible ---------------------------------------------------------------
export function useBibleSearch(
  query: string,
  version = 'tdb77',
  limit = 10,
): UseQueryResult<BibleSearchResponse, Error> {
  return useQuery({
    queryKey: QK.bibleSearch(query, version, limit),
    queryFn: () =>
      client.getJson<BibleSearchResponse>(ROUTES.bibleSearch.path, { q: query, version, limit }),
    enabled: query.length > 0,
    ...defaultQueryOptions,
  })
}

export type BibleContextKind = 'book' | 'word'

export function useBibleStudy(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (book) => client.getJson<RunScriptResult>(ROUTES.bibleStudy.path, { book }),
  })
}

export function useBibleLearn(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (level) => client.getJson<RunScriptResult>(ROUTES.bibleLearn.path, { level }),
  })
}

export function useBibleContext(kind: BibleContextKind): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (value) => {
      const route = kind === 'book' ? ROUTES.bibleContextBook : ROUTES.bibleContextWord
      return client.getJson<RunScriptResult>(route.path, { [kind]: value })
    },
  })
}

export function useBibleTopics(): UseMutationResult<RunScriptResult, Error, void> {
  return useMutation({
    mutationFn: () => client.getJson<RunScriptResult>(ROUTES.bibleContextTopics.path),
  })
}

// ---- gemini mutations ------------------------------------------------------
export function useGeminiFillEn(): UseMutationResult<RunScriptResult, Error, number> {
  return useMutation({
    mutationFn: (limit) => client.getJson<RunScriptResult>(ROUTES.geminiFillEn.path, { limit }),
  })
}

export function useGeminiFillMy(): UseMutationResult<RunScriptResult, Error, number> {
  return useMutation({
    mutationFn: (limit) => client.getJson<RunScriptResult>(ROUTES.geminiFillMy.path, { limit }),
  })
}

export function useGeminiCoverage(): UseQueryResult<RunScriptResult, Error> {
  return useQuery({ queryKey: ['gemini', 'coverage'], queryFn: () => client.getJson<RunScriptResult>(ROUTES.geminiCoverage.path), ...defaultQueryOptions })
}

// ---- training mutations ----------------------------------------------------
export function useTrainingGenerate(): UseMutationResult<RunScriptResult, Error, { type: string; count: number }> {
  return useMutation({
    mutationFn: ({ type, count }) =>
      client.getJson<RunScriptResult>(ROUTES.trainingGenerate.path, { type, count }),
  })
}

export function useTrainingBuild(): UseMutationResult<RunScriptResult, Error, void> {
  return useMutation({
    mutationFn: () => client.getJson<RunScriptResult>(ROUTES.trainingBuild.path),
  })
}

export function useTrainingBuildQwen(): UseMutationResult<RunScriptResult, Error, void> {
  return useMutation({
    mutationFn: () => client.getJson<RunScriptResult>(ROUTES.trainingBuildQwen.path),
  })
}

// ---- quiz / grammar / paragraph / zvs --------------------------------------
export function useQuiz(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (level) => client.getJson<RunScriptResult>(ROUTES.quiz.path, { level }),
  })
}

export function useGrammarCheck(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (text) => client.getJson<RunScriptResult>(ROUTES.grammar.path, { text }),
  })
}

export function useParagraphAnalyze(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (text) => client.getJson<RunScriptResult>(ROUTES.paragraph.path, { text }),
  })
}

export function useZvsValidate(): UseMutationResult<RunScriptResult, Error, string> {
  return useMutation({
    mutationFn: (text) => client.getJson<RunScriptResult>(ROUTES.zvs.path, { text }),
  })
}

// ---- export ---------------------------------------------------------------
export function useExport(): UseMutationResult<RunScriptResult, Error, ExportDataType> {
  return useMutation({
    mutationFn: (dataType) => client.getJson<RunScriptResult>(ROUTES.exportFor(dataType).path),
  })
}

// ---- chat ------------------------------------------------------------------
export function useChatZolai(): UseMutationResult<ChatZolaiResponse, Error, { prompt: string }> {
  return useMutation({
    mutationFn: ({ prompt }) => client.postJson<ChatZolaiResponse>(ROUTES.chatZolai.path, { prompt }),
  })
}