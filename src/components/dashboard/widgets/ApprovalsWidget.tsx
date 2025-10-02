import { ArrowUpRight, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useApprovalsSummary } from '@/hooks/useApprovalsSummary'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'

export function ApprovalsWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { data, isPending } = useApprovalsSummary()
  const trackTelemetry = useDashboardTelemetry()
  const navigate = useNavigate()

  if (isPending) {
    return <WidgetLoadingState rows={3} />
  }

  if (!data || data.pendingCount === 0) {
    return (
      <WidgetEmptyState
        title="No approvals pending"
        description="You'll see requests that need your review before they can be ordered."
        actionLabel="Review approvals"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'approvals', action: 'review' })
          navigate('/orders')
        }}
      />
    )
  }

  const oldestLabel = data.oldestPendingHours >= 24
    ? `${Math.floor(data.oldestPendingHours / 24)}d`
    : `${Math.max(data.oldestPendingHours, 1)}h`

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-600">
          <ClipboardList className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Pending approvals</p>
          <p className="text-3xl font-semibold text-foreground">{data.pendingCount}</p>
          <p className="text-xs font-medium text-muted-foreground">Oldest pending {oldestLabel}</p>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'approvals', action: 'review' })
          navigate('/orders')
        }}
      >
        Open approvals
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
