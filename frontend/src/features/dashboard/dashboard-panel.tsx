import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PanelShell } from '@/components/panel/panel-shell'
import { useHealth, useStats } from '@/lib/zolai-core/hooks'

interface Stat {
  label: string
  value: number | string
}

const SUMMARY_LABELS = [
  ['total_tables', 'Tables'],
  ['total_rows', 'Total rows'],
  ['database_size_mb', 'DB size (MB)'],
  ['dictionary.total', 'Dictionary entries'],
  ['bible.total_verses', 'Bible verses'],
  ['training.translation_pairs', 'Translation pairs'],
  ['training.training_exercises', 'Training exercises'],
  ['training.vocabulary_entries', 'Vocabulary entries'],
  ['training.phrases', 'Phrases'],
  ['training.grammar_patterns', 'Grammar patterns'],
  ['training.word_alignments', 'Word alignments'],
] as const

function readPath(obj: Record<string, unknown>, path: string): number | string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
  return typeof value === 'number' ? value : typeof value === 'string' ? value : undefined
}

export function DashboardPanel() {
  const stats = useStats()
  const health = useHealth()

  const summary: Stat[] = SUMMARY_LABELS.map(([path, label]) => ({
    label,
    value: readPath((stats.data ?? {}) as Record<string, unknown>, path) ?? '—',
  }))

  const loading = stats.isLoading || stats.isFetching

  return (
    <PanelShell
      title="Dashboard"
      description="zolai-core local instance overview"
      actions={
        <Badge variant="outline" className="text-emerald-300">
          {health.data?.status ?? 'unknown'}
        </Badge>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {summary.map((s) =>
            loading ? (
              <Skeleton key={s.label} className="h-20 w-full" />
            ) : (
              <Card key={s.label} className="border-border bg-muted/20">
                <CardHeader className="px-3 pb-1 pt-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            ),
          )}
        </div>

        {stats.error ? (
          <p className="text-sm text-red-400">
            Failed to load stats: {stats.error.message}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Tables</p>
          {stats.data?.table_details ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(stats.data.table_details).map(([name, rows]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm"
                >
                  <span className="truncate text-muted-foreground">{name}</span>
                  <span className="font-mono text-foreground">{rows.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </PanelShell>
  )
}