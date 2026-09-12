import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from '@/components/ui/select'
import {
  baseUrlFromPort,
  loadSettings,
  portFromBaseUrl,
  saveSettings,
  type Settings,
} from '@/lib/zolai-core/config'

interface SettingsFormProps {
  onClose: () => void
}

const PROVIDERS = ['openai', 'gemini', 'anthropic', 'custom'] as const

/** Mounted fresh each time the dialog opens so state re-initializes from storage. */
export function SettingsForm({ onClose }: SettingsFormProps) {
  const [form, setForm] = useState<Settings>(() => loadSettings())

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => {
      const next: Settings = { ...prev, [key]: value }
      if (key === 'port') {
        next.baseUrl = baseUrlFromPort(Number(value) || 8000)
      }
      if (key === 'baseUrl') {
        const p = portFromBaseUrl(String(value))
        if (p !== null) next.port = p
      }
      return next
    })
  }

  function handleSave() {
    saveSettings(form)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">AI provider</label>
        <Select value={form.provider} onValueChange={(v) => update('provider', v as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Chat mode</label>
        <Select value={form.zolaiMode ? 'zolai' : 'generic'} onValueChange={(v) => update('zolaiMode', v === 'zolai')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zolai">Zolai-aware (local /chat/zolai)</SelectItem>
            <SelectItem value="generic">Generic OpenAI-compatible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Base URL</label>
        <Input value={form.baseUrl} onChange={(e) => update('baseUrl', e.target.value)} placeholder="http://localhost:8000" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Port (localhost)</label>
        <Input type="number" value={form.port} onChange={(e) => update('port', Number(e.target.value) || 8000)} placeholder="8000" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Model</label>
        <Input value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="gpt-4o-mini" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">API key (generic mode only)</label>
        <Input type="password" value={form.apiKey} onChange={(e) => update('apiKey', e.target.value)} placeholder="sk-…" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save settings</Button>
      </div>
    </div>
  )
}