/**
 * Route table mirroring zolai-core/docs/api-contract.md.
 * This file and the backend contract must stay in sync — any divergence is a bug.
 */

export const METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const

export type HttpMethod = (typeof METHOD)[keyof typeof METHOD]

export interface RouteDefinition {
  method: HttpMethod
  path: string
}

/**
 * All valid paths. Path-segment params are expressed as factory fns
 * (e.g. `exportFor('dictionary')`). Query params are added by the caller.
 */
export const ROUTES = {
  health: { method: METHOD.GET, path: '/health' },

  // ---- Desktop router -----------------------------------------------------
  stats: { method: METHOD.GET, path: '/desktop/stats' },
  tables: { method: METHOD.GET, path: '/desktop/tables' },
  query: { method: METHOD.GET, path: '/desktop/query' },
  dictBrowse: { method: METHOD.GET, path: '/desktop/dict/browse' },
  dictNonZolai: { method: METHOD.GET, path: '/desktop/dict/non-zolai' },
  bibleStudy: { method: METHOD.GET, path: '/desktop/bible/study' },
  bibleLearn: { method: METHOD.GET, path: '/desktop/bible/learn' },
  bibleContextBook: { method: METHOD.GET, path: '/desktop/bible/context/book' },
  bibleContextWord: { method: METHOD.GET, path: '/desktop/bible/context/word' },
  bibleContextTopics: { method: METHOD.GET, path: '/desktop/bible/context/topics' },
  geminiFillEn: { method: METHOD.GET, path: '/desktop/gemini/fill-en' },
  geminiFillMy: { method: METHOD.GET, path: '/desktop/gemini/fill-my' },
  geminiCoverage: { method: METHOD.GET, path: '/desktop/gemini/coverage' },
  trainingGenerate: { method: METHOD.GET, path: '/desktop/training/generate' },
  trainingBuild: { method: METHOD.GET, path: '/desktop/training/build' },
  trainingBuildQwen: { method: METHOD.GET, path: '/desktop/training/build-qwen' },
  exportFor: (dataType: ExportDataType): RouteDefinition => ({
    method: METHOD.GET,
    path: `/desktop/export/${dataType}`,
  }),
  quiz: { method: METHOD.GET, path: '/desktop/test/quiz' },
  grammar: { method: METHOD.GET, path: '/desktop/grammar/check' },
  paragraph: { method: METHOD.GET, path: '/desktop/paragraph/analyze' },
  zvs: { method: METHOD.GET, path: '/desktop/zvs/validate' },
  auditRecent: { method: METHOD.GET, path: '/desktop/audit/recent' },

  // ---- Application router -------------------------------------------------
  bibleSearch: { method: METHOD.GET, path: '/bible/search' },
  dictSearchAll: { method: METHOD.GET, path: '/dictionary/search/all' },
  dictSearchMy: { method: METHOD.GET, path: '/dictionary/search/my' },
  dictAdd: { method: METHOD.POST, path: '/dictionary/add' },
  dictUpdate: { method: METHOD.PUT, path: '/dictionary/update' },
  dictDelete: { method: METHOD.DELETE, path: '/dictionary/delete' },
  monitorHealth: { method: METHOD.GET, path: '/monitor/health' },
  monitorCoverage: { method: METHOD.GET, path: '/monitor/coverage' },
  monitorAudit: { method: METHOD.GET, path: '/monitor/audit' },

  // ---- Chat ---------------------------------------------------------------
  chatZolai: { method: METHOD.POST, path: '/chat/zolai' },
} as const

export type ExportDataType =
  | 'dictionary'
  | 'bible'
  | 'vocabulary'
  | 'grammar'
  | 'phrases'
  | 'exercises'

export const EXPORT_TYPES: readonly ExportDataType[] = [
  'dictionary',
  'bible',
  'vocabulary',
  'grammar',
  'phrases',
  'exercises',
]