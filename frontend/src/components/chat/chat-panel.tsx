import { useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

import { ChatMessage } from '@/components/chat/chat-message'
import { PanelShell } from '@/components/panel/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chatStream } from '@/lib/ai/provider'
import { loadSettings } from '@/lib/zolai-core/config'
import type { ChatMessageRole } from '@/lib/zolai-core/types'

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageRole[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const settings = loadSettings()

  function scrollToBottom() {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)

    const updated: ChatMessageRole[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    let tokenStream = ''
    try {
      await chatStream(updated, (token) => {
        tokenStream += token
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: tokenStream }
          return next
        })
        scrollToBottom()
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant' && !last.content) {
          next[next.length - 1] = { role: 'assistant', content: msg }
        } else {
          next.push({ role: 'assistant', content: msg })
        }
        return next
      })
      toast.error(msg)
    } finally {
      setBusy(false)
      scrollToBottom()
    }
  }

  return (
    <PanelShell
      title="Chat"
      description={settings.zolaiMode ? 'Zolai-aware · local /chat/zolai' : `Generic OpenAI-compatible · ${settings.provider}`}
      scroll={false}
    >
      <div className="flex h-full flex-col gap-3">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-1">
            {messages.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Ask a question. Switch Zolai-aware vs generic mode in Settings.
              </p>
            ) : (
              messages.map((m, i) => (
                <ChatMessage
                  key={i}
                  message={m}
                  streaming={busy && i === messages.length - 1 && m.role === 'assistant'}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border pt-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSend()
            }}
            placeholder={settings.zolaiMode ? 'Compose a Zolai prompt…' : 'Type a message…'}
            disabled={busy}
          />
          <Button size="icon" onClick={() => void handleSend()} disabled={busy} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </PanelShell>
  )
}