import type { ChatMessageRole } from '@/lib/zolai-core/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageRole
  streaming?: boolean
}

export function ChatMessage({ message, streaming }: ChatMessageProps) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-muted/40 text-foreground',
        )}
      >
        {message.content}
        {streaming ? <span className="inline-block animate-pulse">▍</span> : null}
      </div>
    </div>
  )
}