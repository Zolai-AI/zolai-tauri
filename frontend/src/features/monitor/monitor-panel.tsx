import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PanelShell } from '@/components/panel/panel-shell'
import { formatOutput, formatCompact } from '@/components/panel/format'
import { useMonitorCoverage, useMonitorHealth } from '@/lib/zolai-core/hooks'

function Field({ label, value }: { label: string; value: unknown }) {
  const displayValue = typeof value === 'number' && Number.isFinite(value) && value >= 1000
    ? formatCompact(value)
    : formatOutput(value)
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{displayValue}</span>
    </div>
  )
}

export function MonitorPanel() {
  const health = useMonitorHealth()
  const coverage = useMonitorCoverage()

  const healthEntries = health.data
    ? Object.entries(health.data).filter(([k, _v]) => k !== 'tables')
    : []
  const coverageEntries = coverage.data ? Object.entries(coverage.data) : []

  return (
    <PanelShell title="Monitor" description="DB health + translation coverage">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-muted/20">
          <CardHeader className="px-3 py-2">
            <CardTitle className="text-sm font-medium text-foreground">DB Health</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            {health.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : health.error ? (
              <p className="text-sm text-red-400">{health.error.message}</p>
            ) : (
              <div>
                {healthEntries.map(([k, v]) => (
                  <Field key={k} label={k} value={v} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/20">
          <CardHeader className="px-3 py-2">
            <CardTitle className="text-sm font-medium text-foreground">Translation Coverage</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            {coverage.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : coverage.error ? (
              <p className="text-sm text-red-400">{coverage.error.message}</p>
            ) : (
              <div>
                {coverageEntries.map(([k, v]) => (
                  <Field key={k} label={k} value={v} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PanelShell>
  )
}