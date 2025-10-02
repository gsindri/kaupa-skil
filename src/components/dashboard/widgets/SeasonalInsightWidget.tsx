import { CalendarDays } from 'lucide-react'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { formatCurrency } from '@/lib/format'

export function SeasonalInsightWidget(_: DashboardWidgetComponentProps) {
  const { data, isLoading } = useSpendSnapshot()

  if (isLoading) {
    return <WidgetLoadingState rows={3} />
  }

  if (!data) {
    return (
      <WidgetEmptyState
        title="Seasonal insight unavailable"
        description="Order history unlocks forecasted peaks so you can plan ahead."
        actionLabel="See seasonal plan"
      />
    )
  }

  const thisWeek = data.sparkline.slice(-7).reduce((total, point) => total + point.value, 0)
  const lastWeek = data.sparkline.slice(-14, -7).reduce((total, point) => total + point.value, 0)
  const delta = thisWeek - lastWeek
  const direction = delta >= 0 ? 'more' : 'less'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-600">
          <CalendarDays className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Seasonal insight</p>
          <p className="text-xs text-muted-foreground">Week-over-week order comparison</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        This week you ordered <span className="font-semibold text-foreground">{formatCurrency(Math.abs(delta))}</span> {direction} than last week.
        Keep an eye on supplier capacity for the upcoming peak.
      </p>
    </div>
  )
}
