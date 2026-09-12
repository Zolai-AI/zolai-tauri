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

/** Compact number formatting: 1.0K, 189.6K, 1.2M, 845.0B; 1 decimal; non-finite → String; < 1000 as-is. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  if (value < 1000) return String(value)
  const units = ['', 'K', 'M', 'B', 'T']
  const idx = Math.floor(Math.log10(Math.abs(value)) / 3)
  const unit = units[Math.min(idx, units.length - 1)]
  const scaled = value / Math.pow(1000, idx)
  return `${scaled.toFixed(1)}${unit}`
}