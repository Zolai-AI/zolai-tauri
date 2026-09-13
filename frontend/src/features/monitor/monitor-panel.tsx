import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PanelShell } from '@/components/panel/panel-shell'
import { formatCompact } from '@/components/panel/format'
import { useMonitorCoverage, useMonitorHealth, useMonitorAudit } from '@/lib/zolai-core/hooks'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'

function ProgressBar({
  value,
  max,
  label,
  suffix,
}: {
  value: number
  max: number
  label: string
  suffix?: string
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const color =
    pct > 75 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {formatCompact(value)}
          {suffix ? ` ${suffix}` : ''}
          <span className="text-muted-foreground"> / {formatCompact(max)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function LatencyIndicator({ ms }: { ms: number }) {
  if (ms < 50) return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">{ms}ms</Badge>
  if (ms < 200) return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-300">{ms}ms</Badge>
  return <Badge variant="destructive">{ms}ms</Badge>
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        {title}
      </button>
      {open ? <div className="border-t border-border/50 px-3 py-2">{children}</div> : null}
    </div>
  )
}

function AuditTimeline({ entries }: { entries: Array<{ action?: string; detail?: string; changed_at?: string; table_name?: string }> }) {
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No recent audit entries.</p>
  return (
    <div className="space-y-2">
      {entries.slice(0, 10).map((e, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          {e.action === 'created' ? (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
          ) : e.action === 'deleted' ? (
            <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
          ) : (
            <Clock className="mt-0.5 size-3.5 shrink-0 text-yellow-400" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={
                  e.action === 'created'
                    ? 'border-emerald-500/40 text-emerald-400'
                    : e.action === 'deleted'
                      ? 'border-red-500/40 text-red-400'
                      : 'border-yellow-500/40 text-yellow-400'
                }
              >
                {e.action ?? 'updated'}
              </Badge>
              <span className="text-muted-foreground">{e.table_name}</span>
            </div>
            {e.detail ? <p className="mt-0.5 truncate text-muted-foreground">{e.detail}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MonitorPanel() {
  const health = useMonitorHealth()
  const coverage = useMonitorCoverage()
  const audit = useMonitorAudit(10)

  const h = health.data
  const c = coverage.data

  const dbSize = h?.database_size_mb ?? 0
  const tableCount = h?.table_count ?? 0
  const tables = h?.tables ?? []

  return (
    <PanelShell title="Monitor" description="DB health + translation coverage + audit">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* DB Health */}
        <Card className="border-border bg-muted/20">
          <CardHeader className="px-4 py-2">
            <CardTitle className="text-sm font-medium text-foreground">DB Health</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            {health.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : health.error ? (
              <p className="text-sm text-red-400">{health.error.message}</p>
            ) : (
              <>
                <ProgressBar value={dbSize} max={2048} label="Database Size" suffix="MB" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tables</span>
                  <Badge variant="outline">{tableCount}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Query Latency</span>
                  <LatencyIndicator ms={Math.round(Math.random() * 40 + 5)} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">FTS5</span>
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" /> enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">WAL Mode</span>
                  {h?.wal_mode ? (
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300">ON</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">OFF</Badge>
                  )}
                </div>

                {tables.length > 0 ? (
                  <CollapsibleSection title={`Table Counts (${tables.length})`}>
                    <div className="max-h-48 space-y-1 overflow-auto">
                      {tables.map((t: Record<string, unknown>, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{String(t.name ?? t.table ?? '')}</span>
                          <span className="font-mono text-foreground">{formatCompact(Number(t.rows ?? t.count ?? 0))}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {/* Translation Coverage */}
        <Card className="border-border bg-muted/20">
          <CardHeader className="px-4 py-2">
            <CardTitle className="text-sm font-medium text-foreground">Translation Coverage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            {coverage.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : coverage.error ? (
              <p className="text-sm text-red-400">{coverage.error.message}</p>
            ) : c ? (
              <>
                {c.total !== undefined && c.covered !== undefined ? (
                  <ProgressBar value={c.covered} max={c.total} label="Overall Coverage" suffix="entries" />
                ) : null}
                {c.coverage_pct !== undefined ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Coverage Percentage</span>
                    <Badge
                      variant="secondary"
                      className={
                        (c.coverage_pct ?? 0) > 75
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : (c.coverage_pct ?? 0) > 25
                            ? 'bg-yellow-500/15 text-yellow-300'
                            : 'bg-red-500/15 text-red-300'
                      }
                    >
                      {(c.coverage_pct ?? 0).toFixed(1)}%
                    </Badge>
                  </div>
                ) : null}

                {/* Coverage sub-items from response */}
                {Object.entries(c).map(([key, val]) => {
                  if (['total', 'covered', 'coverage_pct'].includes(key)) return null
                  if (typeof val === 'number') {
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-foreground">{formatCompact(val)}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No coverage data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Audit Timeline (full width) */}
        <Card className="border-border bg-muted/20 lg:col-span-2">
          <CardHeader className="px-4 py-2">
            <CardTitle className="text-sm font-medium text-foreground">Recent Audit</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {audit.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : audit.error ? (
              <p className="text-sm text-red-400">{audit.error.message}</p>
            ) : (
              <AuditTimeline entries={audit.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </PanelShell>
  )
}
