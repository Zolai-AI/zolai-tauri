import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRunQuery, useTables } from '@/lib/zolai-core/hooks'

export function DatabasePanel() {
  const tables = useTables()
  const [sql, setSql] = useState('')
  const [executedSql, setExecutedSql] = useState('')
  const query = useRunQuery(executedSql || null)

  const tableList = Array.isArray(tables.data?.tables) ? tables.data.tables : []
  const columns = Array.isArray(query.data?.columns) ? query.data.columns : []
  const rows = Array.isArray(query.data?.rows) ? query.data.rows : []

  return (
    <PanelShell title="Database" description="Table inventory + raw SQL explorer">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Tables</p>
          {tables.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tableList.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm"
                >
                  <span className="truncate text-muted-foreground">{t.name}</span>
                  <span className="font-mono text-foreground">{t.rows.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">SQL Query</p>
          <div className="flex items-center gap-2">
            <Input
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="SELECT * FROM dictionary LIMIT 10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setExecutedSql(sql.trim())
              }}
            />
            <Button size="sm" onClick={() => setExecutedSql(sql.trim())} disabled={!sql.trim()}>
              Run
            </Button>
          </div>

          {query.isFetching ? (
            <Skeleton className="h-40 w-full" />
          ) : query.data ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    {(columns).map((c) => (
                      <th key={c} className="px-2 py-1 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      {columns.map((c) => (
                        <td key={c} className="px-2 py-1 font-mono">{formatCell(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run a read-only query (e.g. SELECT) to inspect data.</p>
          )}
        </div>
      </div>
    </PanelShell>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '∅'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}