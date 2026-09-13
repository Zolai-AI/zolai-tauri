import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useGeminiCoverage, useGeminiFillEn, useGeminiFillMy } from '@/lib/zolai-core/hooks'
import { useState } from 'react'

export function GeminiPanel() {
  const fillEn = useGeminiFillEn()
  const fillMy = useGeminiFillMy()
  const coverage = useGeminiCoverage()

  const [enLimit, setEnLimit] = useState('50')
  const [myLimit, setMyLimit] = useState('50')

  return (
    <PanelShell title="Gemini" description="Fill translation gaps via pcore-brain API">
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Fill missing English</p>
              <p className="text-xs text-muted-foreground">Translate missing English entries via pcore-brain.</p>
            </div>
            <Button size="sm" onClick={() => void fillEn.mutateAsync(Number(enLimit) || 50)} disabled={fillEn.isPending}>
              Run
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

        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Fill missing Myanmar</p>
              <p className="text-xs text-muted-foreground">Translate missing Myanmar entries via pcore-brain.</p>
            </div>
            <Button size="sm" onClick={() => void fillMy.mutateAsync(Number(myLimit) || 50)} disabled={fillMy.isPending}>
              Run
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

        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-medium text-foreground">Coverage status</p>
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
