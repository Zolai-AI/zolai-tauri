/** Deterministic stringification of arbitrary API payloads for display. */
export function formatOutput(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return JSON.stringify(value, null, 2)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.output === 'string') return record.output
    if (typeof record.error === 'string') return record.error
    if (typeof record.success === 'boolean') {
      const rest = { ...record }
      if (record.success) delete rest.success
      return JSON.stringify(rest, null, 2)
    }
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}