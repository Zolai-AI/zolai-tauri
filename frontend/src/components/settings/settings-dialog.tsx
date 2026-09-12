import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SettingsForm } from '@/components/settings/settings-form'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Connection and AI provider configuration. Saved locally on this device.
            </DialogDescription>
          </DialogHeader>
          <SettingsForm onClose={() => onOpenChange(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  )
}