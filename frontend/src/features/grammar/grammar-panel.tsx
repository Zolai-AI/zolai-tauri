import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { useGrammarCheck } from '@/lib/zolai-core/hooks'

export function GrammarPanel() {
  const grammar = useGrammarCheck()
  const actions: ActionSpec[] = [
    {
      key: 'check',
      label: 'Check grammar',
      description: 'ZVS 2018 + SOV + negation + question validation.',
      fields: [{ key: 'text', label: 'Text', placeholder: 'A pai leh …' }],
      run: (v) => grammar.mutateAsync(v.text ?? ''),
    },
  ]
  return <ScriptPanel title="Grammar" description="Grammar-aware sentence checker" actions={actions} />
}