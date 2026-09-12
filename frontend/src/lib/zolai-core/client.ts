/**
 * Typed HTTP client for the local zolai-core REST API.
 *
 * Single choke point: NO raw `fetch(...)` is allowed outside this module.
 * Base URL always comes from settings (`loadSettings().baseUrl`).
 */
import { loadSettings } from './config'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = loadSettings().baseUrl.replace(/\/+$/, '')
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

/** Single internal request primitive — the ONLY place fetch() is called. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options
  const url = buildUrl(path, query)

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (cause) {
    throw new ApiError(0, `Network error: could not reach ${url}`, cause)
  }

  if (!response.ok) {
    let detail: unknown = null
    try {
      detail = await response.json()
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, `Request failed (HTTP ${response.status})`, detail)
  }

  const text = await response.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export function getJson<T>(path: string, query?: RequestOptions['query']): Promise<T> {
  return request<T>(path, { method: 'GET', query })
}

export function postJson<T>(path: string, body: unknown, query?: RequestOptions['query']): Promise<T> {
  return request<T>(path, { method: 'POST', body, query })
}

export function putJson<T>(path: string, body: unknown, query?: RequestOptions['query']): Promise<T> {
  return request<T>(path, { method: 'PUT', body, query })
}

export function deleteJson<T>(path: string, query?: RequestOptions['query']): Promise<T> {
  return request<T>(path, { method: 'DELETE', query })
}