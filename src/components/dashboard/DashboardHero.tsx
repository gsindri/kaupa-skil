import React, { useMemo } from 'react'
import { differenceInCalendarDays, startOfWeek, format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { formatCurrency } from '@/lib/format'
import { getNextDeliveryDate } from './delivery-helpers'

const formatPercent = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '—'
  const rounded = Number.parseFloat(value.toFixed(1))
  const prefix = rounded > 0 ? '+' : ''
  return `${prefix}${rounded}%`
}

interface MetricProps {
  label: string
  value: string
  caption?: string
  isLoading: boolean
}

function Metric({ label, value, caption, isLoading }: MetricProps) {
  return (
    <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-20" />
          {caption ? <Skeleton className="h-3 w-24" /> : null}
        </div>
      ) : (
        <>
          <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
          {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
        </>
      )}
    </div>
  )
}

export function DashboardHero() {
  const { data: spendData, isLoading: spendLoading } = useSpendSnapshot()
  const { rules, isLoading: deliveriesLoading } = useUpcomingDeliveries()
  const { suppliers, isLoading: suppliersLoading } = useSupplierConnections()

  const referenceDate = useMemo(() => new Date(), [])

  const deliveriesDue = useMemo(() => {
    return rules.reduce((count, rule) => {
      const nextDelivery = getNextDeliveryDate(rule.delivery_days, rule.cutoff_time, referenceDate)
      if (!nextDelivery) return count

      const diff = differenceInCalendarDays(nextDelivery, referenceDate)
      if (diff < 0 || diff > 7) return count

      return count + 1
    }, 0)
  }, [referenceDate, rules])

  const ordersThisWeek = spendData?.ordersThisWeek ?? 0
  const spendThisWeek = spendData ? formatCurrency(spendData.thisWeek) : '—'
  const spendChange = spendData ? formatPercent(spendData.change) : undefined

  const heroHasActivity = (spendData?.thisWeek ?? 0) > 0 || ordersThisWeek > 0 || deliveriesDue > 0

  const headline = heroHasActivity ? 'This week, at a glance.' : 'Ready when you are.'
  const subheadline = heroHasActivity
    ? 'Stay on top of spend and arrivals without diving into reports.'
    : 'Connect suppliers and place your first order to see live numbers here.'

  const connectedSuppliers = suppliers.filter((s) => s.status === 'connected').length
  const needsAttention = suppliers.filter((s) => s.status === 'needs_login' || s.status === 'disconnected').length

  const supplierFootnote = suppliersLoading
    ? 'Checking your supplier syncs…'
    : suppliers.length === 0
      ? 'Add a supplier to start syncing catalogues and prices.'
      : needsAttention > 0
        ? `${needsAttention} supplier${needsAttention === 1 ? '' : 's'} need attention.`
        : `${connectedSuppliers} of ${suppliers.length} supplier${suppliers.length === 1 ? '' : 's'} connected.`

  return (
    <Card className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Week of {format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'd MMM')}
            </span>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{headline}</h2>
            <p className="text-sm text-muted-foreground max-w-xl">{subheadline}</p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3 lg:w-auto">
            <Metric
              label="Spend"
              value={spendThisWeek}
              caption={
                spendData
                  ? spendData.thisWeek > 0
                    ? `${spendChange ?? '—'} vs last week`
                    : 'Awaiting first orders'
                  : undefined
              }
              isLoading={spendLoading}
            />
            <Metric
              label="Orders"
              value={ordersThisWeek.toString()}
              caption={
                spendLoading
                  ? undefined
                  : ordersThisWeek === 0
                    ? 'No orders yet'
                    : 'So far this week'
              }
              isLoading={spendLoading}
            />
            <Metric
              label="Deliveries"
              value={deliveriesDue.toString()}
              caption={
                deliveriesLoading
                  ? 'Due in the next 7 days'
                  : deliveriesDue > 0
                    ? 'Due in the next 7 days'
                    : 'Add delivery windows to plan ahead'
              }
              isLoading={deliveriesLoading}
            />
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">{supplierFootnote}</p>
      </div>
    </Card>
  )
}

export default DashboardHero
