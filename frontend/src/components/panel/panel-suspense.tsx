import { PanelShell } from '@/components/panel/panel-shell'
import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder shown while a lazy panel chunk is loading. */
export function PanelSkeleton() {
  return (
    <PanelShell title="Loading…">
      <div className="space-y-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </PanelShell>
  )
}