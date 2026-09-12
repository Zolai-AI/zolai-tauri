import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { useParagraphAnalyze } from '@/lib/zolai-core/hooks'

export function ParagraphPanel() {
  const paragraph = useParagraphAnalyze()
  const actions: ActionSpec[] = [
    {
      key: 'analyze',
      label: 'Analyze paragraph',
      description: 'Style profiling + sentence-by-sentence breakdown.',
      fields: [{ key: 'text', label: 'Text', placeholder: 'Paste a Zolai paragraph…' }],
      run: (v) => paragraph.mutateAsync(v.text ?? ''),
    },
  ]
  return <ScriptPanel title="Paragraph" description="Paragraph learning & style intelligence" actions={actions} />
}