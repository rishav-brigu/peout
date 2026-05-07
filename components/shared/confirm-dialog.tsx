'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[#E7E3DC]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#1C1917]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#78716C]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#E7E3DC]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              destructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#92400E] hover:bg-[#78350F] text-white'
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
