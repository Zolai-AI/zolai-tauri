import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import {
  useTrainingBuild,
  useTrainingBuildQwen,
  useTrainingGenerate,
} from '@/lib/zolai-core/hooks'

export function TrainingPanel() {
  const generate = useTrainingGenerate()
  const build = useTrainingBuild()
  const buildQwen = useTrainingBuildQwen()

  const actions: ActionSpec[] = [
    {
      key: 'generate',
      label: 'Generate training data',
      description: 'Grammar-aware exercise synthesis.',
      fields: [
        { key: 'type', label: 'Type', placeholder: 'negation', default: 'negation' },
        { key: 'count', label: 'Count', kind: 'number', placeholder: '1000', default: '1000' },
      ],
      run: (v) => generate.mutateAsync({ type: v.type || 'negation', count: Number(v.count) || 1000 }),
    },
    {
      key: 'build',
      label: 'Build dataset',
      description: 'Assemble the full training dataset.',
      run: () => build.mutateAsync(),
    },
    {
      key: 'build-qwen',
      label: 'Build Qwen chat dataset',
      description: 'Export sentences in Qwen3 chat-message format.',
      run: () => buildQwen.mutateAsync(),
    },
  ]

  return <ScriptPanel title="Training" description="Train on locally generated Zolai data" actions={actions} />
}