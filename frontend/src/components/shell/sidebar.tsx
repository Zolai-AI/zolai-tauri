import type { LucideIcon } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  section: string
}

interface SidebarProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

/** Group nav items by section, render as a vertical list. */
export function Sidebar({ items, activeId, onSelect }: SidebarProps) {
  const sections = [...new Set(items.map((i) => i.section))]

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div
          className="size-6 rounded bg-gradient-to-br from-sky-400 to-sky-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-wide text-foreground">Zolai Studio</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section, si) => {
          const sectionItems = items.filter((i) => i.section === section)
          return (
            <div key={section}>
              {si > 0 ? <Separator className="my-2" /> : null}
              <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section}
              </div>
              {sectionItems.map((item) => {
                const Icon = item.icon
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      'mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}