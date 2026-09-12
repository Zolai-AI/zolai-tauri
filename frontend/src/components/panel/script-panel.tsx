import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { RunScriptResult } from '@/lib/zolai-core/types'

export interface ActionField {
  key: string
  label: string
  kind?: 'text' | 'number'
  placeholder?: string
  default?: string
}

export interface ActionSpec {
  key: string
  label: string
  description?: string
  fields?: ActionField[]
  /** Returns the run-script result; may use values keyed by field.key */
  run: (values: Record<string, string>) => Promise<RunScriptResult>
}

interface ScriptPanelProps {
  title: string
  description?: string
  actions: ActionSpec[]
}

interface ResultEntry {
  key: string
  data: RunScriptResult
  busy: boolean
}

/** Generic panel that renders a list of user-triggered run-script actions. */
export function ScriptPanel({ title, description, actions }: ScriptPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [results, setResults] = useState<ResultEntry[]>([])

  function setField(fieldKey: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldKey]: value }))
  }

  async function runAction(action: ActionSpec) {
    const fieldValues: Record<string, string> = {}
    for (const f of action.fields ?? []) {
      fieldValues[f.key] = values[f.key] ?? f.default ?? ''
    }
    setResults((prev) => [...prev, { key: action.key, data: { success: false, error: '' }, busy: true }])
    try {
      const data = await action.run(fieldValues)
      setResults((prev) => prev.map((r) => (r.key === action.key ? { key: action.key, data, busy: false } : r)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setResults((prev) =>
        prev.map((r) =>
          r.key === action.key
            ? { key: action.key, data: { success: false, error: message }, busy: false }
            : r,
        ),
      )
    }
  }

  return (
    <PanelShell title={title} description={description}>
      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.key} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                {action.description ? (
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                ) : null}
              </div>
              <Button
                size="sm"
                onClick={() => void runAction(action)}
                disabled={results.some((r) => r.key === action.key && r.busy)}
              >
                Run
              </Button>
            </div>

            {action.fields && action.fields.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {action.fields.map((field) => (
                  <label key={field.key} className="space-y-1">
                    <span className="text-xs text-muted-foreground">{field.label}</span>
                    <Input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={values[field.key] ?? field.default ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setField(field.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            ) : null}

            {results
              .filter((r) => r.key === action.key)
              .map((r) =>
                r.busy ? (
                  <div key={r.key} className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div key={r.key} className="mt-3">
                    <RunScriptBlock result={r.data} />
                  </div>
                ),
              )}
          </div>
        ))}
      </div>
    </PanelShell>
  )
}