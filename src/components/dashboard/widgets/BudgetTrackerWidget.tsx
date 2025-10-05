import { ArrowUpRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { formatCurrency } from '@/lib/format'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'
import { CART_ROUTE } from '@/lib/featureFlags'

export function BudgetTrackerWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { data, isLoading } = useSpendSnapshot()
  const navigate = useNavigate()
  const trackTelemetry = useDashboardTelemetry()

  if (isLoading) {
    return <WidgetLoadingState rows={4} />
  }

  if (!data || data.categories.length === 0) {
    return (
      <WidgetEmptyState
        title="No budgets configured"
        description="Assign department budgets to compare actual spend against plan."
        actionLabel="Manage budgets"
      />
    )
  }

  const categories = data.categories.slice(0, 4)

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Wallet className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Budget tracker</p>
          <p className="text-xs text-muted-foreground">Top departments vs cap</p>
        </div>
      </div>

      <ul className="space-y-3">
        {categories.map((category) => {
          const budget = category.amount * 1.35 + 1
          const progress = Math.min((category.amount / budget) * 100, 100)
          return (
            <li key={category.name} className="rounded-2xl bg-muted/40 px-4 py-3">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>{category.name}</span>
                <span>
                  {formatCurrency(category.amount)} / {formatCurrency(budget)}
                </span>
              </div>
              <Progress value={progress} className="mt-2 h-2 rounded-full" />
            </li>
          )
        })}
      </ul>

      <Button
        size="lg"
        className="inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'budget-tracker', action: 'manage' })
          navigate(CART_ROUTE)
        }}
      >
        Manage budgets
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
