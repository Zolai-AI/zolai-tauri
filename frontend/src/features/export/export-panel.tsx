import { ScriptPanel, type ActionSpec } from '@/components/panel/script-panel'
import { useExport } from '@/lib/zolai-core/hooks'
import { EXPORT_TYPES } from '@/lib/zolai-core/contract'

export function ExportPanel() {
  const exportData = useExport()
  const actions: ActionSpec[] = [
    {
      key: 'export',
      label: 'Export data',
      description: 'JSONL export of a dataset type.',
      fields: [
        {
          key: 'dataType',
          label: 'Data type',
          default: 'dictionary',
          placeholder: 'dictionary',
        },
      ],
      run: (v) => {
        let dataType = v.dataType?.trim() || 'dictionary'
        if (!EXPORT_TYPES.includes(dataType as (typeof EXPORT_TYPES)[number])) {
          dataType = 'dictionary'
        }
        return exportData.mutateAsync(dataType as (typeof EXPORT_TYPES)[number])
      },
    },
  ]
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Types: {EXPORT_TYPES.join(' · ')}
      </p>
      <ScriptPanel title="Export" description="Export processed datasets to JSONL" actions={actions} />
    </div>
  )
}