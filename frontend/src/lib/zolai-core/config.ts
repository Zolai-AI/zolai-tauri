import { z } from 'zod'

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
})

export type Settings = z.infer<typeof SettingsSchema>

const STORAGE_KEY = 'zolai_settings'

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://localhost:8000',
  port: 8000,
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  zolaiMode: true,
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