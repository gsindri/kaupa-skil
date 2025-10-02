import { useMemo } from 'react'
import { ArrowUpRight, PackageOpen } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { usePantrySignals } from '@/hooks/usePantrySignals'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'

interface LowStockItem {
  id: string
  name: string
  onHand: number
  daysLeft: number
  parLevel: number
}

function formatSku(id: string) {
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-2)}` : id
}

export function LowStockWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { items, isLoading } = usePantrySignals()
  const navigate = useNavigate()
  const trackTelemetry = useDashboardTelemetry()

  const lowStockItems = useMemo(() => {
    if (!items || items.length === 0) return [] as LowStockItem[]
    const today = new Date()

    return items
      .map((item) => {
        const daysSinceOrder = item.lastOrderedAt ? differenceInCalendarDays(today, new Date(item.lastOrderedAt)) : 0
        const parLevel = 14
        const projectedDaysLeft = Math.max(parLevel - daysSinceOrder, 0)
        return {
          id: item.id,
          name: item.name,
          onHand: item.lastQuantity ?? 0,
          daysLeft: projectedDaysLeft,
          parLevel,
        }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }, [items])

  if (isLoading) {
    return <WidgetLoadingState rows={5} />
  }

  if (lowStockItems.length === 0) {
    return (
      <WidgetEmptyState
        title="No monitored items"
        description="Add priority products to your watchlist to track when it's time to reorder."
        actionLabel="Add products to watchlist"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'low-stock', action: 'watchlist' })
          navigate('/pantry')
        }}
      />
    )
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <PackageOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Top risks</p>
          <p className="text-2xl font-semibold text-foreground">{lowStockItems.length} items</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {lowStockItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">SKU {formatSku(item.id)} · On hand {item.onHand}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              &lt;{Math.max(item.daysLeft, 0)} days
            </span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'low-stock', action: 'reorder' })
          navigate('/pantry')
        }}
      >
        Reorder items
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
