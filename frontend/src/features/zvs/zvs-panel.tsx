import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { useZvsValidate } from '@/lib/zolai-core/hooks'

export function ZvsPanel() {
  const zvs = useZvsValidate()
  const actions: ActionSpec[] = [
    {
      key: 'validate',
      label: 'Validate text',
      description: 'Flag forbidden forms (pathian, ram, fapa, bawipa, siangpahrang, cu/cun…).',
      fields: [{ key: 'text', label: 'Text', placeholder: 'Pathian in …' }],
      run: (v) => zvs.mutateAsync(v.text ?? ''),
    },
  ]
  return <ScriptPanel title="ZVS 2018" description="Orthography compliance validator" actions={actions} />
}