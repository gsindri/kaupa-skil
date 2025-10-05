import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { usePantrySignals } from '@/hooks/usePantrySignals'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'
import { CART_ROUTE } from '@/lib/featureFlags'

export function SmartReorderWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { items, isLoading } = usePantrySignals()
  const navigate = useNavigate()
  const trackTelemetry = useDashboardTelemetry()

  if (isLoading) {
    return <WidgetLoadingState rows={4} />
  }

  if (!items || items.length === 0) {
    return (
      <WidgetEmptyState
        title="No predictions yet"
        description="As soon as we see ordering cadence, we’ll project upcoming stockouts."
        actionLabel="Generate order"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'smart-reorder', action: 'generate' })
          navigate(CART_ROUTE)
        }}
      />
    )
  }

  const today = new Date()
  const projections = items
    .map((item) => {
      const daysSince = item.lastOrderedAt ? differenceInCalendarDays(today, new Date(item.lastOrderedAt)) : 0
      const reorderIn = Math.max(7 - Math.floor(daysSince / Math.max(item.orderCount, 1)), 1)
      return {
        id: item.id,
        name: item.name,
        reorderIn,
        recommendedDate: new Date(today.getTime() + reorderIn * 24 * 60 * 60 * 1000),
      }
    })
    .sort((a, b) => a.reorderIn - b.reorderIn)
    .slice(0, 3)

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Predicted stockouts</p>
          <p className="text-xs text-muted-foreground">Based on your recent order history</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {projections.map((entry) => (
          <li key={entry.id} className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{entry.name}</p>
            <p className="text-xs text-muted-foreground">Reorder {formatDistanceToNow(entry.recommendedDate, { addSuffix: true })}</p>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'smart-reorder', action: 'generate' })
          navigate(CART_ROUTE)
        }}
      >
        Generate order
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
