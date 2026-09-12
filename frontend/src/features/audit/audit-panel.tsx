import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { formatOutput } from '@/components/panel/format'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditRecent, useMonitorAudit } from '@/lib/zolai-core/hooks'

export function AuditPanel() {
  const recent = useAuditRecent()
  const entries = useMonitorAudit(50)
  const auditRows = Array.isArray(entries.data) ? entries.data : []

  return (
    <PanelShell title="Audit" description="Recent audit log (data_audit_log)">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Recent entries</p>
          {recent.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <RunScriptBlock result={recent.data} />
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Last {auditRows.length || 50} audit rows</p>
          {entries.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : auditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="px-2 py-1">Action</th>
                    <th className="px-2 py-1">Table</th>
                    <th className="px-2 py-1">Entity</th>
                    <th className="px-2 py-1">Detail</th>
                    <th className="px-2 py-1">When</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((e, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="px-2 py-1">
                        <Badge variant="outline" className="text-[10px]">{String(e.action ?? '')}</Badge>
                      </td>
                      <td className="px-2 py-1 font-mono">{String(e.table_name ?? '')}</td>
                      <td className="px-2 py-1">{String(e.entity ?? '')}</td>
                      <td className="max-w-[16rem] truncate px-2 py-1 text-muted-foreground">{formatOutput(e.detail)}</td>
                      <td className="px-2 py-1 text-muted-foreground">{String(e.changed_at ?? e.timestamp ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  )
}