import type { ReactNode } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface PanelShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  /** Show a scroll area wrapping the content body. */
  scroll?: boolean
  className?: string
}

/** Consistent card wrapper used by every feature panel. */
export function PanelShell({ title, description, actions, children, scroll = true, className }: PanelShellProps) {
  const body = (
    <CardContent className="p-0">
      <div className="p-4">{children}</div>
    </CardContent>
  )

  return (
    <Card className={`flex h-full flex-col border-border bg-card ${className ?? ''}`}>
      <CardHeader className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      {scroll ? (
        <ScrollArea className="flex-1">
          <div className="flex h-full min-h-0 flex-col">{body}</div>
        </ScrollArea>
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">{body}</div>
      )}
    </Card>
  )
}