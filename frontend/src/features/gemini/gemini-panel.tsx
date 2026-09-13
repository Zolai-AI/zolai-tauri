import { useState, useEffect } from 'react'
import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGeminiCoverage, useGeminiFillEn, useGeminiFillMy } from '@/lib/zolai-core/hooks'
import { loadSettings, saveSettings, MODEL_PRESETS, type Settings } from '@/lib/zolai-core/config'
import { Zap, RefreshCw, Wifi } from 'lucide-react'

export function GeminiPanel() {
  const fillEn = useGeminiFillEn()
  const fillMy = useGeminiFillMy()
  const coverage = useGeminiCoverage()

  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [enLimit, setEnLimit] = useState('50')
  const [myLimit, setMyLimit] = useState('50')

  // Keep settings in sync with localStorage
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const currentProvider = settings.provider ?? 'gemini'
  const currentModel = settings.model ?? MODEL_PRESETS[currentProvider]?.default ?? ''
  const providerLabel = MODEL_PRESETS[currentProvider]?.label ?? currentProvider

  function handleProviderChange(value: string) {
    const next = { ...settings, provider: value, model: MODEL_PRESETS[value]?.default ?? '' }
    setSettings(next)
    saveSettings(next)
  }

  function handleModelChange(value: string) {
    const next = { ...settings, model: value }
    setSettings(next)
    saveSettings(next)
  }

  function handleFillEn() {
    void fillEn.mutateAsync({
      limit: Number(enLimit) || 50,
      provider: currentProvider,
      model: currentModel,
    })
  }

  function handleFillMy() {
    void fillMy.mutateAsync({
      limit: Number(myLimit) || 50,
      provider: currentProvider,
      model: currentModel,
    })
  }

  const models = MODEL_PRESETS[currentProvider]?.models ?? []

  return (
    <PanelShell title="Translation Fill" description="Fill translation gaps via AI provider">
      <div className="space-y-4">
        {/* Provider + Model Selector */}
        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Provider</p>
            <Badge variant="secondary" className="text-[10px] bg-primary/10">{providerLabel}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Provider</label>
              <Select value={currentProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODEL_PRESETS).map(([id, p]) => (
                    <SelectItem key={id} value={id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Model</label>
              <Select value={currentModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.length > 0 ? (
                    models.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value={currentModel} disabled>{currentModel || 'No models'}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses {providerLabel} · {currentModel || 'default model'}
          </p>
        </div>

        {/* Fill English */}
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Fill missing English</p>
              <p className="text-xs text-muted-foreground">Translate missing English entries via {currentProvider}.</p>
            </div>
            <Button size="sm" onClick={handleFillEn} disabled={fillEn.isPending}>
              <Zap className="mr-1 size-3" />
              {fillEn.isPending ? 'Running…' : 'Run'}
            </Button>
          </div>
          <div className="mt-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Limit</span>
              <Input type="number" value={enLimit} onChange={(e) => setEnLimit(e.target.value)} placeholder="50" />
            </label>
          </div>
          {fillEn.isPending ? (
            <div className="mt-3"><Skeleton className="h-4 w-40" /></div>
          ) : fillEn.data ? (
            <div className="mt-3"><RunScriptBlock result={fillEn.data} /></div>
          ) : null}
        </div>

        {/* Fill Myanmar */}
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Fill missing Myanmar</p>
              <p className="text-xs text-muted-foreground">Translate missing Myanmar entries via {currentProvider}.</p>
            </div>
            <Button size="sm" onClick={handleFillMy} disabled={fillMy.isPending}>
              <Zap className="mr-1 size-3" />
              {fillMy.isPending ? 'Running…' : 'Run'}
            </Button>
          </div>
          <div className="mt-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Limit</span>
              <Input type="number" value={myLimit} onChange={(e) => setMyLimit(e.target.value)} placeholder="50" />
            </label>
          </div>
          {fillMy.isPending ? (
            <div className="mt-3"><Skeleton className="h-4 w-40" /></div>
          ) : fillMy.data ? (
            <div className="mt-3"><RunScriptBlock result={fillMy.data} /></div>
          ) : null}
        </div>

        {/* Coverage */}
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Coverage status</p>
            <Button variant="ghost" size="sm" onClick={() => void coverage.refetch()} disabled={coverage.isFetching}>
              <RefreshCw className={`size-3 ${coverage.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {coverage.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <RunScriptBlock result={coverage.data} />
          )}
        </div>
      </div>
    </PanelShell>
  )
}
