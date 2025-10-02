import { ArrowDownRight, ArrowUpRight, LineChart } from 'lucide-react'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { formatCurrency } from '@/lib/format'

export function PriceTrendsWidget(_: DashboardWidgetComponentProps) {
  const { data, isLoading } = useSpendSnapshot()

  if (isLoading) {
    return <WidgetLoadingState rows={4} />
  }

  if (!data || data.categories.length === 0) {
    return (
      <WidgetEmptyState
        title="No price trends yet"
        description="Once we have a few weeks of spend, we’ll surface the biggest movers by category."
        actionLabel="Open price analytics"
      />
    )
  }

  const topCategories = data.categories.slice(0, 4)

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <LineChart className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Category trends</p>
          <p className="text-xs text-muted-foreground">30 day change vs 90 day average</p>
        </div>
      </div>

      <ul className="space-y-3">
        {topCategories.map((category) => {
          const positive = category.change >= 0
          const Icon = positive ? ArrowUpRight : ArrowDownRight
          return (
            <li
              key={category.name}
              className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(category.amount)} last 30 days</p>
              </div>
              <div className={`inline-flex items-center gap-1 text-sm font-semibold ${positive ? 'text-rose-600' : 'text-emerald-600'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {Math.abs(category.change).toFixed(1)}%
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
