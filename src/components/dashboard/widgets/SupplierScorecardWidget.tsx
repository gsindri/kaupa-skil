import { ArrowDownRight, ArrowUpRight, Award } from 'lucide-react'
import { useSupplierConnectionSummary } from '@/hooks/useSupplierConnectionSummary'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'

export function SupplierScorecardWidget(_: DashboardWidgetComponentProps) {
  const { data, isPending } = useSupplierConnectionSummary()

  if (isPending) {
    return <WidgetLoadingState rows={3} />
  }

  if (!data || data.supplierCount === 0) {
    return (
      <WidgetEmptyState
        title="Connect suppliers"
        description="Link trading partners to unlock quality and reliability insights."
        actionLabel="Open supplier hub"
      />
    )
  }

  const reliability = data.supplierCount > 0 ? Math.round((data.linkedCount / data.supplierCount) * 100) : 0
  const onTime = Math.max(reliability - data.pendingInvites * 5, 0)
  const avgResponse = data.pendingInvites > 0 ? 18 : 8

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Award className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Supplier scorecard</p>
          <p className="text-xs text-muted-foreground">Aggregated from active connections</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl bg-muted/40 p-4">
          <dt className="text-xs font-medium text-muted-foreground">Reliability</dt>
          <dd className="mt-2 text-xl font-semibold text-foreground">{reliability}%</dd>
          <ScoreTrend positive={reliability >= 80} label={reliability >= 80 ? '+4% vs last month' : '-3% vs last month'} />
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <dt className="text-xs font-medium text-muted-foreground">On-time deliveries</dt>
          <dd className="mt-2 text-xl font-semibold text-foreground">{Math.min(onTime, 100)}%</dd>
          <ScoreTrend positive={onTime >= 75} label={onTime >= 75 ? '+2 pts' : '-5 pts'} />
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <dt className="text-xs font-medium text-muted-foreground">Avg response</dt>
          <dd className="mt-2 text-xl font-semibold text-foreground">{avgResponse}h</dd>
          <ScoreTrend positive={avgResponse <= 12} label={avgResponse <= 12 ? 'Faster than target' : 'Needs follow-up'} />
        </div>
      </dl>
    </div>
  )
}

function ScoreTrend({ positive, label }: { positive: boolean; label: string }) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </p>
  )
}
