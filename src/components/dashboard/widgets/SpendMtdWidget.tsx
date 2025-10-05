import { ArrowUpRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { formatCurrency } from '@/lib/format'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'
import { CART_ROUTE } from '@/lib/featureFlags'

export function SpendMtdWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { data, isLoading } = useSpendSnapshot()
  const navigate = useNavigate()
  const trackTelemetry = useDashboardTelemetry()

  if (isLoading) {
    return <WidgetLoadingState variant="stat" />
  }

  if (!data) {
    return (
      <WidgetEmptyState
        title="Connect finance data"
        description="Sync orders or import invoices to track spend against budgets."
        actionLabel="Open spend report"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'spend-mtd', action: 'connect' })
          navigate(CART_ROUTE)
        }}
      />
    )
  }

  const monthToDate = data.sparkline.reduce((total, point) => total + point.value, 0)
  const budgetMtd = Math.max(monthToDate * 1.25, monthToDate || 1)
  const progress = Math.min((monthToDate / budgetMtd) * 100, 100)
  const delta = data.change
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs last week`

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600">
          <TrendingUp className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Spend month to date</p>
          <p className="text-3xl font-semibold text-foreground">{formatCurrency(monthToDate)}</p>
          <p className="text-xs font-medium text-muted-foreground">{deltaLabel}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Budget {formatCurrency(budgetMtd)}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'spend-mtd', action: 'report' })
          navigate(CART_ROUTE)
        }}
      >
        Open spend report
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
