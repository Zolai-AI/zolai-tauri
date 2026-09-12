import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { useQuiz } from '@/lib/zolai-core/hooks'

export function QuizPanel() {
  const quiz = useQuiz()
  const actions: ActionSpec[] = [
    {
      key: 'quiz',
      label: 'Start quiz',
      description: 'Proficiency quiz at a CEFR level.',
      fields: [{ key: 'level', label: 'Level', placeholder: 'A1', default: 'A1' }],
      run: (v) => quiz.mutateAsync(v.level || 'A1'),
    },
  ]
  return (
    <ScriptPanel
      title="Quiz"
      description="Proficiency testing (A1–C2), 7 question types, 232 total at full run"
      actions={actions}
    />
  )
}