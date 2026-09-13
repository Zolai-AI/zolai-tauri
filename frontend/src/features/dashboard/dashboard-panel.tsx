import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PanelShell } from '@/components/panel/panel-shell'
import { formatCompact } from '@/components/panel/format'
import { useHealth, useStats } from '@/lib/zolai-core/hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const CHART_COLORS = [
  'oklch(0.65 0.15 250)',
  'oklch(0.7 0.15 145)',
  'oklch(0.75 0.15 75)',
  'oklch(0.65 0.2 340)',
  'oklch(0.7 0.15 200)',
  'oklch(0.65 0.15 100)',
  'oklch(0.7 0.15 300)',
]

const KEY_METRICS = [
  { path: 'total_tables', label: 'Tables', icon: '📊', color: 'oklch(0.65 0.15 250)' },
  { path: 'total_rows', label: 'Total Rows', icon: '📦', color: 'oklch(0.7 0.15 145)' },
  { path: 'database_size_mb', label: 'DB Size', icon: '💾', color: 'oklch(0.75 0.15 75)' },
  { path: 'dictionary.total', label: 'Dictionary', icon: '📖', color: 'oklch(0.65 0.2 340)' },
  { path: 'bible.total_verses', label: 'Bible Verses', icon: '📕', color: 'oklch(0.7 0.15 200)' },
  { path: 'training.translation_pairs', label: 'Trans. Pairs', icon: '🔄', color: 'oklch(0.65 0.15 100)' },
] as const

function readPath(obj: Record<string, unknown>, path: string): number | string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
  return typeof value === 'number' ? value : typeof value === 'string' ? value : undefined
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border/50 p-4"
      style={{ background: `color-mix(in oklch, ${color} 8%, transparent)` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full"
        style={{ background: color }}
      />
    </div>
  )
}

function sizeColor(rows: number): string {
  if (rows < 1000) return 'text-emerald-400'
  if (rows < 100000) return 'text-yellow-400'
  return 'text-red-400'
}

export function DashboardPanel() {
  const stats = useStats()
  const health = useHealth()

  const loading = stats.isLoading || stats.isFetching

  const metricValues = useMemo(() => {
    if (!stats.data) return []
    return KEY_METRICS.map((m) => {
      const raw = readPath(stats.data as unknown as Record<string, unknown>, m.path)
      const value = typeof raw === 'number' ? formatCompact(raw) : (raw ?? '—')
      return { ...m, value }
    })
  }, [stats.data])

  const barData = useMemo(() => {
    if (!stats.data?.table_details) return []
    return Object.entries(stats.data.table_details)
      .map(([name, rows]) => ({ name: name.length > 14 ? name.slice(0, 12) + '…' : name, rows: Number(rows) || 0 }))
      .sort((a, b) => b.rows - a.rows)
      .slice(0, 10)
  }, [stats.data])

  const pieData = useMemo(() => {
    if (!stats.data) return []
    const d = stats.data
    const segments = [
      { name: 'Dictionary', value: d.dictionary?.total ?? 0 },
      { name: 'Bible', value: d.bible?.total_verses ?? 0 },
      { name: 'Training', value: d.training?.translation_pairs ?? 0 },
      { name: 'Exercises', value: d.training?.training_exercises ?? 0 },
      { name: 'Other', value: Math.max(0, (d.total_rows ?? 0) - ((d.dictionary?.total ?? 0) + (d.bible?.total_verses ?? 0) + (d.training?.translation_pairs ?? 0) + (d.training?.training_exercises ?? 0))) },
    ].filter((s) => s.value > 0)
    return segments
  }, [stats.data])

  const tableEntries = useMemo(() => {
    if (!stats.data?.table_details) return []
    return Object.entries(stats.data.table_details)
      .map(([name, rows]) => ({ name, rows: Number(rows) || 0 }))
      .sort((a, b) => b.rows - a.rows)
  }, [stats.data])

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
      <div className="space-y-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            : metricValues.map((m) => (
                <MetricCard key={m.path} label={m.label} value={m.value} icon={m.icon} color={m.color} />
              ))}
        </div>

        {stats.error ? (
          <p className="text-sm text-red-400">Failed to load stats: {stats.error.message}</p>
        ) : null}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-border bg-muted/20">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-sm font-medium text-foreground">Top 10 Tables by Row Count</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} tickFormatter={(v: number) => formatCompact(v)} />
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(0.2 0 0)',
                        border: '1px solid oklch(0.3 0 0)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value) => [formatCompact(Number(value)), 'Rows']}
                    />
                    <Bar dataKey="rows" radius={[4, 4, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No table data</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/20">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-sm font-medium text-foreground">Data Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : pieData.length > 0 ? (
                <div className="flex items-center">
                  <ResponsiveContainer width="55%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'oklch(0.2 0 0)',
                          border: '1px solid oklch(0.3 0 0)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value) => [formatCompact(Number(value))]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 text-xs">
                    {pieData.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-mono text-foreground">{formatCompact(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables grid */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">All Tables</p>
          {tableEntries.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {tableEntries.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm"
                >
                  <span className="truncate text-muted-foreground">{t.name}</span>
                  <span className={`font-mono ${sizeColor(t.rows)}`}>
                    {formatCompact(t.rows)}
                  </span>
                </div>
              ))}
            </div>
          ) : loading ? (
            <Skeleton className="h-32 w-full" />
          ) : null}
        </div>
      </div>
    </PanelShell>
  )
}
