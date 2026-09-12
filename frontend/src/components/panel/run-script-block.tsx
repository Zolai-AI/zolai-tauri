import { Badge } from '@/components/ui/badge'
import type { RunScriptResult } from '@/lib/zolai-core/types'

/** Render a run-script result as success badge / error / output block. */
export function RunScriptBlock({ result }: { result?: RunScriptResult | null }) {
  if (!result) return null
  if ('error' in result && result.error) {
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-3 font-mono text-sm text-red-300">
        {result.error}
      </pre>
    )
  }
  if ('success' in result && result.success) {
    return (
      <div className="space-y-2">
        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
          ✓ success
        </Badge>
        {result.output ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
            {result.output}
          </pre>
        ) : null}
      </div>
    )
  }
  if ('output' in result && result.output) {
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
        {result.output}
      </pre>
    )
  }
  return null
}