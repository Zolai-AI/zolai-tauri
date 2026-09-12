import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyanmarSearch } from '@/lib/zolai-core/hooks'

export function MyanmarPanel() {
  const [q, setQ] = useState('')
  const search = useMyanmarSearch(q)

  const results = search.data?.results
  const rows = search.data?.rows
  const entries: Record<string, unknown>[] = Array.isArray(results)
    ? results
    : Array.isArray(rows)
      ? rows
      : []

  return (
    <PanelShell title="Myanmar" description="Myanmar ↔ Zolai dictionary lookup">
      <div className="space-y-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Myanmar text…" />
        {search.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results.</p>
        ) : (
          <div className="space-y-1.5">
            {entries.map((e, i) => (
              <div key={i} className="rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm">
                <span className="font-medium text-foreground">{String(e.zolai ?? e.word ?? '')}</span>
                <span className="text-muted-foreground"> — {String(e.myanmar ?? '')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  )
}