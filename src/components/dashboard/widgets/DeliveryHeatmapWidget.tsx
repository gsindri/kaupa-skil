import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import { Fragment, useMemo } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BUCKET_LABELS = ['Morning', 'Midday', 'Evening']

function bucketForTime(cutoff: string | null): number {
  if (!cutoff) return 1
  const [hours] = cutoff.split(':')
  const hourValue = Number.parseInt(hours ?? '12', 10)
  if (hourValue < 10) return 0
  if (hourValue < 16) return 1
  return 2
}

export function DeliveryHeatmapWidget(_: DashboardWidgetComponentProps) {
  const { rules, isLoading } = useUpcomingDeliveries()

  const heatmap = useMemo(() => {
    const grid = Array.from({ length: BUCKET_LABELS.length }, () => Array(7).fill(0));
    rules.forEach((rule) => {
      const bucket = bucketForTime(rule.cutoff_time);
      (rule.delivery_days ?? []).forEach((day) => {
        const isoIndex = Math.max(Math.min(day, 7), 1) - 1
        grid[bucket][isoIndex] += 1
      })
    })
    return grid
  }, [rules])

  if (isLoading) {
    return <WidgetLoadingState rows={3} />
  }

  const totalSlots = heatmap.flat().reduce((total, value) => total + value, 0)
  if (!rules || rules.length === 0 || totalSlots === 0) {
    return (
      <WidgetEmptyState
        title="Delivery heatmap"
        description="Log delivery windows to see which days are busiest across suppliers."
        actionLabel="Adjust windows"
      />
    )
  }

  const maxValue = Math.max(...heatmap.flat()) || 1

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Delivery heatmap</p>
          <p className="text-xs text-muted-foreground">Higher intensity means more supplier windows</p>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 text-xs">
        <div className="h-8" aria-hidden="true" />
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center font-medium text-muted-foreground">
            {label}
          </div>
        ))}
        {heatmap.map((row, rowIndex) => (
          <Fragment key={BUCKET_LABELS[rowIndex]}>
            <div className="flex items-center text-muted-foreground">{BUCKET_LABELS[rowIndex]}</div>
            {row.map((value, columnIndex) => {
              const intensity = value / maxValue
              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className="flex h-10 items-center justify-center rounded-xl border border-transparent"
                  style={{
                    backgroundColor: `rgba(59,130,246,${Math.max(intensity, 0.1)})`,
                    color: intensity > 0.6 ? 'white' : '#1f2937',
                  }}
                >
                  {value > 0 ? value : ''}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
