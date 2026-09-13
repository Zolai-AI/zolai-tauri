import React, { useState, useCallback } from 'react'
import { Bot, Copy, Check } from 'lucide-react'
import type { ChatMessageRole } from '@/lib/zolai-core/types'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageRole
  streaming?: boolean
}

/** Simple markdown-like rendering: bold, italic, code, code blocks. */
function renderContent(text: string) {
  // Split into lines, then process inline formatting
  const lines = text.split('\n')

  return lines.map((line, lineIdx) => {
    // Code block detection (line starts with ```)
    if (line.trimStart().startsWith('```')) {
      return null // handled below
    }

    // Inline: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = []
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }
      const token = match[0]
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={`${lineIdx}-${match.index}`}>{token.slice(2, -2)}</strong>)
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={`${lineIdx}-${match.index}`}>{token.slice(1, -1)}</em>)
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={`${lineIdx}-${match.index}`} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            {token.slice(1, -1)}
          </code>,
        )
      }
    }

    if (parts.length === 0) {
      if (line.trim() === '') return <div key={lineIdx} className="h-2" />
      return <div key={lineIdx}>{line}</div>
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }

    return <div key={lineIdx}>{parts}</div>
  })
}

export function ChatMessage({ message, streaming }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [message.content])

  return (
    <div className={cn('group flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {isUser ? null : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn('relative flex max-w-[80%] flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/50 text-foreground border border-border/40 rounded-bl-md',
          )}
        >
          {isUser ? message.content : renderContent(message.content)}
          {streaming ? <span className="ml-0.5 inline-block animate-pulse text-primary">▍</span> : null}
        </div>

        {/* Copy button — appears on hover, assistant only */}
        {!isUser && message.content && !streaming ? (
          <button
            onClick={handleCopy}
            className="mt-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
            aria-label="Copy message"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
