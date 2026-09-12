import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Skeleton } from '@/components/ui/skeleton'
import { useGeminiCoverage, useGeminiFillEn, useGeminiFillMy } from '@/lib/zolai-core/hooks'

export function GeminiPanel() {
  const fillEn = useGeminiFillEn()
  const fillMy = useGeminiFillMy()
  const coverage = useGeminiCoverage()

  const actions: ActionSpec[] = [
    {
      key: 'fill-en',
      label: 'Fill missing English',
      description: 'Translate missing English entries via pcore-brain.',
      fields: [{ key: 'limit', label: 'Limit', kind: 'number', placeholder: '50', default: '50' }],
      run: (v) => fillEn.mutateAsync(Number(v.limit) || 50),
    },
    {
      key: 'fill-my',
      label: 'Fill missing Myanmar',
      description: 'Translate missing Myanmar entries via pcore-brain.',
      fields: [{ key: 'limit', label: 'Limit', kind: 'number', placeholder: '50', default: '50' }],
      run: (v) => fillMy.mutateAsync(Number(v.limit) || 50),
    },
  ]

  return (
    <div className="space-y-4">
      <ScriptPanel title="Gemini" description="Fill translation gaps via pcore-brain API" actions={actions} />
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">Coverage status</p>
        {coverage.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <RunScriptBlock result={coverage.data} />
        )}
      </div>
    </div>
  )
}