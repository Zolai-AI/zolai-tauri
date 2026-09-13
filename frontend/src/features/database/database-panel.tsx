import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCompact } from '@/components/panel/format'
import {
  useRunQuery,
  useTableData,
  useTableSchema,
  useTables,
} from '@/lib/zolai-core/hooks'

const PAGE_SIZE = 25

export function DatabasePanel() {
  const tables = useTables()
  const tableList = Array.isArray(tables.data?.tables) ? tables.data.tables : []

  // Active table state
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // SQL query state
  const [sql, setSql] = useState('')
  const [executedSql, setExecutedSql] = useState('')
  const query = useRunQuery(executedSql || null)

  // Data & schema hooks
  const tableData = useTableData(activeTable, page, PAGE_SIZE, sortBy, sortDir)
  const tableSchema = useTableSchema(activeTable)

  // Sort toggle
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  // Select table
  const selectTable = (name: string) => {
    setActiveTable(name)
    setPage(1)
    setSortBy(undefined)
    setSortDir('asc')
  }

  // SQL results
  const sqlColumns = Array.isArray(query.data?.columns) ? query.data.columns : []
  const sqlRows = Array.isArray(query.data?.rows) ? query.data.rows : []

  return (
    <PanelShell
      title="Database Browser"
      description="Browse tables, inspect schema, run SQL"
      scroll={false}
    >
      <div className="flex h-full min-h-0 flex-col gap-0">
        {/* ── Main layout: sidebar + content ── */}
        <div className="flex min-h-0 flex-1">
          {/* ── Left sidebar: table list ── */}
          <div className="w-52 shrink-0 border-r border-border overflow-y-auto">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tables ({tableList.length})
              </p>
            </div>
            {tables.isLoading ? (
              <div className="p-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <div className="py-1">
                {tableList.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => selectTable(t.name)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors
                      ${activeTable === t.name
                        ? 'bg-primary/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">
                      {formatCompact(t.rows)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: content area ── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!activeTable ? (
              /* No table selected */
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Select a table from the sidebar to browse its data.</p>
                  <p className="mt-1 text-xs">Use the SQL tab for ad hoc queries.</p>
                </div>
              </div>
            ) : (
              /* Table selected — show tabs */
              <Tabs defaultValue="data" className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
                  <TabsList variant="line">
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                    <TabsTrigger value="sql">SQL</TabsTrigger>
                  </TabsList>
                  {/* Row count badge */}
                  <span className="text-xs text-muted-foreground">
                    {tableData.data
                      ? `${formatCompact(tableData.data.total_rows)} rows`
                      : '...'}
                  </span>
                </div>

                {/* ── Data tab ── */}
                <TabsContent value="data" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {tableData.isLoading ? (
                    <Skeleton className="m-4 h-40" />
                  ) : tableData.data?.error ? (
                    <p className="m-4 text-sm text-destructive">{tableData.data.error}</p>
                  ) : tableData.data ? (
                    <>
                      {/* Pagination controls */}
                      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage(1)}
                          >
                            &laquo;
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            &lsaquo; Prev
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {tableData.data.page} of {tableData.data.total_pages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page >= tableData.data.total_pages}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Next &rsaquo;
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page >= tableData.data.total_pages}
                            onClick={() => setPage(tableData.data!.total_pages)}
                          >
                            &raquo;
                          </Button>
                        </div>
                        {sortBy && (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSortBy(undefined)
                              setSortDir('asc')
                            }}
                          >
                            Clear sort
                          </button>
                        )}
                      </div>

                      {/* Data table */}
                      <div className="min-h-0 flex-1 overflow-auto">
                        <Table className="min-w-[600px]">
                          <TableHeader>
                            <TableRow>
                              {tableData.data.columns.map((c) => (
                                <TableHead
                                  key={c}
                                  className="cursor-pointer select-none hover:text-foreground"
                                  onClick={() => handleSort(c)}
                                >
                                  {c}
                                  {sortBy === c && (
                                    <span className="ml-1 text-muted-foreground">
                                      {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                                    </span>
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.data.rows.map((row, i) => (
                              <TableRow key={i}>
                                {tableData.data.columns.map((c) => (
                                  <TableCell key={c} className="max-w-[300px] truncate font-mono text-xs">
                                    {formatCell(row[c])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : null}
                </TabsContent>

                {/* ── Schema tab ── */}
                <TabsContent value="schema" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {tableSchema.isLoading ? (
                    <Skeleton className="m-4 h-40" />
                  ) : tableSchema.data?.error ? (
                    <p className="m-4 text-sm text-destructive">{tableSchema.data.error}</p>
                  ) : tableSchema.data ? (
                    <div className="min-h-0 flex-1 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>PK</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableSchema.data.columns.map((col) => (
                            <TableRow key={col.name}>
                              <TableCell className="font-mono text-xs">{col.cid}</TableCell>
                              <TableCell className="font-mono text-xs font-medium">
                                {col.name}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {col.type}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {col.notnull ? 'NOT NULL' : 'YES'}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {col.default_value ?? '\u2014'}
                              </TableCell>
                              <TableCell className="text-center">
                                {col.pk && (
                                  <span className="inline-block rounded bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                                    PK
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </TabsContent>

                {/* ── SQL tab ── */}
                <TabsContent value="sql" className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={sql}
                      onChange={(e) => setSql(e.target.value)}
                      placeholder={`SELECT * FROM ${activeTable} LIMIT ${PAGE_SIZE}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setExecutedSql(sql.trim())
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => setExecutedSql(sql.trim())}
                      disabled={!sql.trim()}
                    >
                      Run
                    </Button>
                  </div>

                  {query.isFetching ? (
                    <Skeleton className="mt-4 h-40" />
                  ) : query.data && !query.data.error ? (
                    <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-border">
                      <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            {sqlColumns.map((c) => (
                              <TableHead key={c}>{c}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sqlRows.slice(0, 100).map((row, i) => (
                            <TableRow key={i}>
                              {sqlColumns.map((c) => (
                                <TableCell key={c} className="max-w-[300px] truncate font-mono text-xs">
                                  {formatCell(row[c])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : query.data?.error ? (
                    <p className="mt-4 text-sm text-destructive">{String(query.data.error)}</p>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Run a read-only query (SELECT) to inspect data.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </PanelShell>
  )
}

/** Format a cell value for display. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '\u2205'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
