import { FileWarning } from 'lucide-react'
import { WidgetEmptyState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'

export function InvoiceStatusWidget(_: DashboardWidgetComponentProps) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
        <FileWarning className="h-6 w-6" aria-hidden="true" />
      </div>
      <WidgetEmptyState
        title="Connect invoices"
        description="Sync accounting or upload invoices to monitor unpaid and overdue balances."
        actionLabel="Open invoices"
      />
    </div>
  )
}
