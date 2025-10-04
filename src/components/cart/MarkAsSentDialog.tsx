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
import type { EmailLanguage } from '@/lib/emailTemplates'

interface MarkAsSentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  language: EmailLanguage
  supplierName: string
}

export function MarkAsSentDialog({
  open,
  onOpenChange,
  onConfirm,
  language,
  supplierName
}: MarkAsSentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === 'is' ? 'Staðfesta sendingu' : 'Confirm Sending'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'is'
              ? `Sendir þú pöntunina til ${supplierName}? Þetta mun fjarlægja vörurnar úr körfunni og vista pöntunina.`
              : `Did you send the order to ${supplierName}? This will clear the items from your cart and save the order.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {language === 'is' ? 'Nei, halda í körfu' : 'No, keep in cart'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {language === 'is' ? 'Já, ég sendi það' : 'Yes, I sent it'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
