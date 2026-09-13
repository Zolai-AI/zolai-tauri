import type { ReactNode } from 'react'

import { Sidebar, type NavItem } from '@/components/shell/sidebar'
import { Topbar } from '@/components/shell/topbar'

interface LayoutProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  connected: boolean
  refreshing: boolean
  onRefresh: () => void
  onOpenSettings: () => void
  children: ReactNode
}

export function Layout(props: LayoutProps) {
  const { items, activeId, onSelect, children, ...top } = props
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar items={items} activeId={activeId} onSelect={onSelect} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar {...top} />
        <main className="flex-1 overflow-hidden p-4">{children}</main>
      </div>
    </div>
  )
}