import { z } from 'zod'

/** Available provider IDs. */
export type ProviderId = 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'openrouter' | 'custom'

/** Ollama local base URL. */
export const OLLAMA_BASE_URL = 'http://localhost:11434'

/** Model presets keyed by provider. */
export const MODEL_PRESETS: Record<
  string,
  { models: string[]; default: string; needsKey: boolean; label: string }
> = {
  gemini: {
    label: 'Google Gemini (Local WebAPI)',
    models: [
      'gemini-3-flash',
      'gemini-3-flash-thinking',
      'gemini-3-pro',
      'gemini-3-pro-plus',
      'gemini-3-flash-plus',
      'gemini-3-flash-thinking-plus',
      'gemini-3-pro-advanced',
      'gemini-3-flash-advanced',
      'gemini-3-flash-thinking-advanced',
    ],
    default: 'gemini-3-flash',
    needsKey: false,
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
    default: 'gpt-4o-mini',
    needsKey: true,
  },
  anthropic: {
    label: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    default: 'claude-sonnet-4-20250514',
    needsKey: true,
  },
  ollama: {
    label: 'Ollama (Local)',
    models: [],
    default: 'qwen3:4b',
    needsKey: false,
  },
  openrouter: {
    label: 'OpenRouter (Free Models)',
    models: [
      'mimo-v2.5-free',
      'nemotron-3-ultra-free',
      'hy3-free',
      'muse-spark-1.2-contributor-free',
    ],
    default: 'mimo-v2.5-free',
    needsKey: true,
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    models: [],
    default: 'gpt-4o-mini',
    needsKey: true,
  },
}

/** zod schema for user-persisted app settings (localStorage key `zolai_settings`). */
export const SettingsSchema = z.object({
  /** Full base URL of the local zolai-core FastAPI, e.g. http://localhost:8000 */
  baseUrl: z.string().min(1, 'Base URL is required'),
  /** Convenience port, kept in sync with baseUrl (localhost:port). */
  port: z.number().int().nonnegative(),
  /** Provider label for AI mode. */
  provider: z.string().min(1),
  /** User-supplied API key for the AI provider (generic mode only). */
  apiKey: z.string(),
  /** Model identifier for the AI provider (generic mode only). */
  model: z.string().min(1),
  /** true = Zolai-aware chat (POST /chat/zolai); false = OpenAI-compatible chat. */
  zolaiMode: z.boolean(),
  /** Enable ensemble mode (dispatch to N models, majority vote). */
  ensembleEnabled: z.boolean(),
  /** Number of models in ensemble (3–9). */
  ensembleCount: z.number().int().min(3).max(9),
})

export type Settings = z.infer<typeof SettingsSchema>

const STORAGE_KEY = 'zolai_settings'

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://localhost:8000',
  port: 8000,
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3-flash',
  zolaiMode: true,
  ensembleEnabled: false,
  ensembleCount: 3,
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    return SettingsSchema.parse(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/** Recompute baseUrl from a bare port (keeps it on localhost). */
export function baseUrlFromPort(port: number): string {
  return `http://localhost:${port}`
}

/** Extract just the port number from a base URL, or null if non-local. */
export function portFromBaseUrl(baseUrl: string): number | null {
  try {
    const parsed = new URL(baseUrl)
    if (parsed.port) return Number(parsed.port)
  } catch {
    /* ignore malformed */
  }
  return null
}

/** Read the env-var API key for a given provider, or null. */
export function getEnvApiKey(provider: string): string | null {
  if (typeof window === 'undefined') return null
  const key = `VITE_${provider.toUpperCase()}_API_KEY`
  return import.meta.env[key] || null
}

/** Fetch available model names from a local Ollama instance. */
export async function fetchOllamaModels(baseUrl = OLLAMA_BASE_URL): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models ?? []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}
