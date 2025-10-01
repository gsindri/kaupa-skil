import React, { useMemo } from 'react'
import { addDays, differenceInCalendarDays, format, isSameDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import type { DeliveryRule } from '@/hooks/useUpcomingDeliveries'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import type { SupplierConnection } from '@/hooks/useSupplierConnections'
import { Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { formatCutoffTime, getNextDeliveryDate } from './delivery-helpers'

type DeliveryEntry = {
  rule: DeliveryRule
  supplier: SupplierConnection
  nextDelivery: Date
}

const horizonDays = 6

export function UpcomingDeliveriesCard() {
  const { rules, isLoading } = useUpcomingDeliveries()
  const { suppliers } = useSupplierConnections()

  const referenceDate = useMemo(() => new Date(), [])

  const supplierMap = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.supplier_id ?? supplier.id, supplier]))
  }, [suppliers])

  const deliveries = useMemo<DeliveryEntry[]>(() => {
    return rules
      .map((rule) => {
        const nextDelivery = getNextDeliveryDate(rule.delivery_days, rule.cutoff_time, referenceDate)
        if (!nextDelivery) return null

        if (differenceInCalendarDays(nextDelivery, referenceDate) < 0) return null

        return {
          rule,
          supplier: supplierMap.get(rule.supplier_id ?? rule.id),
          nextDelivery,
        }
      })
      .filter((entry): entry is DeliveryEntry => 
        Boolean(entry && entry.rule && entry.supplier && entry.nextDelivery)
      )
      .sort((a, b) => a.nextDelivery.getTime() - b.nextDelivery.getTime())
  }, [referenceDate, rules, supplierMap])

  const deliveriesWithinWindow = useMemo(() => {
    return deliveries.filter((entry) => {
      const diff = differenceInCalendarDays(entry.nextDelivery, referenceDate)
      return diff >= 0 && diff <= horizonDays
    })
  }, [deliveries, referenceDate])

  const timelineDays = useMemo(() => {
    return Array.from({ length: horizonDays + 1 }, (_, index) => {
      const day = addDays(referenceDate, index)
      const items = deliveriesWithinWindow.filter((entry) => isSameDay(entry.nextDelivery, day))
      return { date: day, items }
    })
  }, [deliveriesWithinWindow, referenceDate])

  const laterDeliveries = deliveries.length - deliveriesWithinWindow.length

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base font-semibold">Deliveries this week</CardTitle>
        <p className="text-sm text-muted-foreground">Line up the drops that are on the horizon.</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {[...Array(horizonDays + 1)].map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-dashed border-muted/60 p-4">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              {timelineDays.map((day) => {
                const isToday = isSameDay(day.date, referenceDate)
                const hasDeliveries = day.items.length > 0
                const tileClassName = [
                  'flex h-full flex-col gap-3 rounded-xl border p-4 transition-colors',
                  hasDeliveries ? 'border-primary/40 bg-primary/5' : 'border-dashed border-muted/60 bg-muted/10',
                  isToday ? 'ring-1 ring-primary/40' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div key={day.date.toISOString()} className={tileClassName}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {format(day.date, 'EEE')}
                      </span>
                      <span className="text-xs text-muted-foreground">{format(day.date, 'd MMM')}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {day.items.length > 0 ? (
                        day.items.map(({ rule, supplier, nextDelivery }) => {
                          const diff = differenceInCalendarDays(nextDelivery, referenceDate)
                          const timingLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`
                          const supplierName = supplier?.name ?? 'Supplier'

                          const details: string[] = [`Cutoff ${formatCutoffTime(rule.cutoff_time)}`]
                          if (rule.free_threshold_ex_vat) {
                            details.push(`Free over ${formatCurrency(rule.free_threshold_ex_vat)}`)
                          } else if (rule.flat_fee) {
                            details.push(`Fee ${formatCurrency(rule.flat_fee)}`)
                          }

                          return (
                            <div
                              key={rule.id}
                              className="rounded-lg border border-primary/30 bg-background/80 px-3 py-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <Truck className="h-4 w-4 text-muted-foreground" />
                                  <span>{supplierName}</span>
                                </div>
                                <Badge variant="secondary" className="text-[11px]">
                                  {timingLabel}
                                </Badge>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">{details.join(' • ')}</p>
                            </div>
                          )
                        })
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                            No deliveries
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {deliveriesWithinWindow.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Set delivery days with each supplier to build your upcoming schedule.
              </p>
            ) : laterDeliveries > 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {laterDeliveries} more delivery{laterDeliveries === 1 ? '' : 'ies'} scheduled later on.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingDeliveriesCard
