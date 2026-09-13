import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from '@/components/ui/select'
import {
  MODEL_PRESETS,
  fetchOllamaModels,
  getEnvApiKey,
  baseUrlFromPort,
  loadSettings,
  portFromBaseUrl,
  saveSettings,
  type Settings,
} from '@/lib/zolai-core/config'

interface SettingsFormProps {
  onClose: () => void
}

/** Mounted fresh each time the dialog opens so state re-initializes from storage. */
export function SettingsForm({ onClose }: SettingsFormProps) {
  const [form, setForm] = useState<Settings>(() => loadSettings())
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [ollamaLoading, setOllamaLoading] = useState(false)

  const providerKey = form.provider in MODEL_PRESETS ? form.provider : 'custom'
  const preset = MODEL_PRESETS[providerKey] ?? MODEL_PRESETS.custom
  const needsKey = preset.needsKey
  const envKey = getEnvApiKey(form.provider)

  // Fetch Ollama models when provider is "ollama"
  useEffect(() => {
    if (providerKey !== 'ollama') return
    setOllamaLoading(true)
    fetchOllamaModels()
      .then(setOllamaModels)
      .finally(() => setOllamaLoading(false))
  }, [providerKey])

  const allModels =
    providerKey === 'ollama'
      ? ollamaModels.length > 0
        ? ollamaModels
        : [preset.default]
      : preset.models.length > 0
        ? preset.models
        : []

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
      // Auto-select default model when provider changes
      if (key === 'provider') {
        const p = MODEL_PRESETS[value as string]
        if (p && p.default) {
          next.model = p.default
        }
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
      {/* Chat mode */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Chat mode</label>
        <Select
          value={form.zolaiMode ? 'zolai' : 'generic'}
          onValueChange={(v) => update('zolaiMode', v === 'zolai')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zolai">Zolai-aware (local /chat/zolai)</SelectItem>
            <SelectItem value="generic">Generic OpenAI-compatible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Provider */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">AI provider</label>
        <Select
          value={form.provider}
          onValueChange={(v) => update('provider', v as string)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_PRESETS).map(([id, p]) => (
              <SelectItem key={id} value={id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model selector */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Model</label>
        {allModels.length > 0 ? (
          <Select value={form.model} onValueChange={(v) => update('model', v)}>
            <SelectTrigger>
              <SelectValue placeholder={preset.default} />
            </SelectTrigger>
            <SelectContent>
              {allModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                  {m === preset.default ? (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      recommended
                    </Badge>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            {ollamaLoading ? (
              <span className="text-xs text-muted-foreground">Fetching models…</span>
            ) : (
              <Input
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
                placeholder={preset.default}
              />
            )}
          </div>
        )}
      </div>

      {/* Base URL (always visible) */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Base URL</label>
        <Input
          value={form.baseUrl}
          onChange={(e) => update('baseUrl', e.target.value)}
          placeholder="http://localhost:8000"
        />
      </div>

      {/* Port */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Port (localhost)</label>
        <Input
          type="number"
          value={form.port}
          onChange={(e) => update('port', Number(e.target.value) || 8000)}
          placeholder="8000"
        />
      </div>

      {/* API key (hidden when not needed) */}
      {needsKey && (
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            API key
            {envKey ? (
              <span className="ml-1 text-emerald-500">
                (Using VITE_{form.provider.toUpperCase()}_API_KEY from environment)
              </span>
            ) : null}
          </label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(e) => update('apiKey', e.target.value)}
            placeholder="sk-…"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save settings</Button>
      </div>
    </div>
  )
}
