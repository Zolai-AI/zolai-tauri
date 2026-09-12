import { Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TopbarProps {
  connected: boolean
  refreshing: boolean
  onRefresh: () => void
  onOpenSettings: () => void
}

/** Top bar: connection indicator (live dot ↔ automatic refresh) + settings button. */
export function Topbar({ connected, refreshing, onRefresh, onOpenSettings }: TopbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'size-2 rounded-full',
            connected ? 'animate-pulse bg-emerald-400' : 'bg-red-400',
          )}
          aria-hidden
        />
        <span className="text-sm text-muted-foreground">
          {connected ? (refreshing ? 'Refreshing…' : 'Connected to zolai-core') : 'zolai-core offline'}
        </span>
        <Badge variant="outline" className="ml-1 hidden text-[10px] sm:inline-flex">
          local
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh all data"
        >
          {refreshing ? '…' : 'Refresh'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  )
}