import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
            <div className="max-h-96 overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{e.action ?? ''}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{e.table_name}</TableCell>
                      <TableCell>{e.entity}</TableCell>
                      <TableCell className="max-w-[16rem] truncate text-muted-foreground">{e.detail ?? ''}</TableCell>
                      <TableCell className="text-muted-foreground">{e.changed_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  )
}
