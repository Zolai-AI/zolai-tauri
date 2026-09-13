import { useRef, useState, useEffect } from 'react'
import { Send, Trash2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { ChatMessage } from '@/components/chat/chat-message'
import { Button } from '@/components/ui/button'
import { chatStream } from '@/lib/ai/provider'
import { loadSettings, MODEL_PRESETS } from '@/lib/zolai-core/config'
import type { ChatMessageRole } from '@/lib/zolai-core/types'

const SUGGESTIONS = [
  "Translate 'God created the earth' to Zolai",
  "What does 'pasian' mean?",
  'Check ZVS compliance: Pathian in gam a piangsak hi',
  'Teach me Zolai negation',
]

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageRole[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const settings = loadSettings()
  const preset = MODEL_PRESETS[settings.provider]
  const providerLabel = preset?.label ?? settings.provider
  const modelShort = settings.model.split('/').pop() ?? settings.model

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

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
    }
  }

  function handleClear() {
    setMessages([])
    setInput('')
  }

  function handleSuggestion(text: string) {
    setInput(text)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar — provider/model indicator */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{modelShort}</span>
          <span className="text-xs text-muted-foreground">· {providerLabel}</span>
          {settings.zolaiMode ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Zolai</span>
          ) : null}
        </div>
        {messages.length > 0 ? (
          <Button variant="ghost" size="icon" className="size-7" onClick={handleClear} aria-label="Clear chat">
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        ) : null}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="size-7 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                {settings.zolaiMode ? 'Zolai AI Assistant' : 'AI Chat'}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {settings.zolaiMode
                  ? 'Ask about Zolai grammar, vocabulary, translations, and more.'
                  : `Connected to ${providerLabel} · ${modelShort}`}
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                message={m}
                streaming={busy && i === messages.length - 1 && m.role === 'assistant'}
              />
            ))}
            {/* Typing indicator */}
            {busy &&
              messages.length > 0 &&
              messages[messages.length - 1]?.role === 'assistant' &&
              !messages[messages.length - 1]?.content && (
                <div className="flex items-center gap-1.5 px-4 text-muted-foreground">
                  <span className="inline-block size-1.5 rounded-full bg-current [animation:typing-bounce_1s_infinite_0ms]" />
                  <span className="inline-block size-1.5 rounded-full bg-current [animation:typing-bounce_1s_infinite_150ms]" />
                  <span className="inline-block size-1.5 rounded-full bg-current [animation:typing-bounce_1s_infinite_300ms]" />
                  <span className="ml-1 text-xs">Thinking...</span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={settings.zolaiMode ? 'Ask about Zolai…' : 'Type a message…'}
            disabled={busy}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="size-9 shrink-0 rounded-full"
            onClick={() => void handleSend()}
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-muted-foreground/60">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
