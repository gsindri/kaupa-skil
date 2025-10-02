import { useMemo } from 'react'
import { ArrowUpRight, Truck } from 'lucide-react'
import { differenceInCalendarDays, format, setHours, setMinutes } from 'date-fns'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { getNextDeliveryDate } from '../delivery-helpers'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'

interface DeliverySlot {
  supplierId: string
  supplierName: string
  date: Date
  cutoffTime?: string | null
}

function formatLabel(date: Date, reference: Date) {
  const diff = differenceInCalendarDays(date, reference)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return format(date, 'EEE dd MMM')
}

function formatWindow(cutoffTime?: string | null) {
  if (!cutoffTime) return 'Window configured'
  const safe = cutoffTime.length >= 5 ? cutoffTime.slice(0, 5) : cutoffTime
  const [hours, minutes] = safe.split(':')
  const base = new Date()
  if (!hours || !minutes) return `Cut-off ${safe}`
  const normalized = setMinutes(setHours(base, Number.parseInt(hours, 10)), Number.parseInt(minutes, 10))
  if (Number.isNaN(normalized.getTime())) {
    return `Cut-off ${safe}`
  }
  return `Cut-off ${format(normalized, 'HH:mm')}`
}

export function DeliveriesWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { rules, isLoading } = useUpcomingDeliveries()
  const { suppliers } = useSupplierConnections()
  const navigate = useNavigate()
  const trackTelemetry = useDashboardTelemetry()

  const timeline = useMemo(() => {
    if (!rules || rules.length === 0) return [] as DeliverySlot[]
    const today = new Date()

    return (rules
      .map((rule) => {
        const date = getNextDeliveryDate(rule.delivery_days, rule.cutoff_time, today)
        if (!date) return null
        const supplierName = suppliers.find((supplier) => supplier.id === rule.supplier_id)?.name ?? 'Supplier'
        return {
          supplierId: rule.supplier_id,
          supplierName,
          date,
          cutoffTime: rule.cutoff_time,
        }
      })
      .filter((entry) => entry !== null) as DeliverySlot[])
      .filter((entry) => differenceInCalendarDays(entry.date, today) <= 7)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [rules, suppliers])

  if (isLoading) {
    return <WidgetLoadingState rows={4} />
  }

  if (timeline.length === 0) {
    return (
      <WidgetEmptyState
        title="No windows set"
        description="Create delivery windows so suppliers and team members know the plan for the week."
        actionLabel="Configure delivery windows"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'deliveries', action: 'configure' })
          navigate('/delivery')
        }}
      />
    )
  }

  const referenceDate = new Date()
  const grouped = timeline.reduce<Record<string, DeliverySlot[]>>((acc, slot) => {
    const label = formatLabel(slot.date, referenceDate)
    acc[label] = acc[label] ? [...acc[label], slot] : [slot]
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Truck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Next 7 days</p>
          <p className="text-2xl font-semibold text-foreground">{timeline.length} deliveries</p>
        </div>
      </div>

      <ol className="mt-6 space-y-4">
        {Object.entries(grouped).map(([label, slots]) => (
          <li key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <span
                  key={`${slot.supplierId}-${slot.date.toISOString()}`}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-foreground"
                >
                  {slot.supplierName}
                  <span className="text-xs text-muted-foreground">{formatWindow(slot.cutoffTime)}</span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'deliveries', action: 'review' })
          navigate('/delivery')
        }}
      >
        Review schedule
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
