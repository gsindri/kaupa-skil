import React, { useMemo } from 'react'
import { addDays, differenceInCalendarDays, format, getISODay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { Truck } from 'lucide-react'

const formatCurrency = (value: number | null) => {
  if (!value || !Number.isFinite(value)) return undefined
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(value)
}

const parseTime = (value: string | null) => {
  if (!value) return { hours: 9, minutes: 0 }
  const segments = value.split(':').map((part) => Number.parseInt(part, 10))
  const [hours = 9, minutes = 0] = segments
  return {
    hours: Number.isFinite(hours) ? hours : 9,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  }
}

const getNextDeliveryDate = (deliveryDays: number[] | null, cutoffTime: string | null) => {
  if (!deliveryDays || deliveryDays.length === 0) return null
  const now = new Date()
  const todayIso = getISODay(now)
  const orderedDays = [...deliveryDays].sort((a, b) => a - b)
  const { hours, minutes } = parseTime(cutoffTime)

  let bestDiff = 7
  orderedDays.forEach((day) => {
    let diff = day - todayIso
    if (diff < 0) diff += 7

    const cutoffToday = new Date(now)
    cutoffToday.setHours(hours, minutes, 0, 0)
    if (diff === 0 && now > cutoffToday) {
      diff = 7
    }

    if (diff < bestDiff) bestDiff = diff
  })

  const deliveryDate = addDays(now, bestDiff)
  deliveryDate.setHours(9, 0, 0, 0)

  return deliveryDate
}

export function UpcomingDeliveriesCard() {
  const { rules, isLoading } = useUpcomingDeliveries()
  const { suppliers } = useSupplierConnections()

  const supplierMap = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.supplier_id ?? supplier.id, supplier]))
  }, [suppliers])

  const upcoming = useMemo(() => {
    return rules
      .map((rule) => {
        const nextDelivery = getNextDeliveryDate(rule.delivery_days, rule.cutoff_time)
        return {
          rule,
          supplier: supplierMap.get(rule.supplier_id ?? rule.id),
          nextDelivery,
        }
      })
      .filter((entry) => entry.nextDelivery)
      .sort((a, b) => (a.nextDelivery?.getTime() ?? 0) - (b.nextDelivery?.getTime() ?? 0))
      .slice(0, 4)
  }, [rules, supplierMap])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Upcoming deliveries</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your delivery cadence, so the kitchen knows what’s landing next.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground">
            Loading delivery schedule…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground text-center space-y-2">
            <p className="font-medium text-foreground">No delivery windows tracked yet</p>
            <p>Set delivery days with each supplier to build your incoming calendar.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map(({ rule, supplier, nextDelivery }) => {
              if (!nextDelivery) return null
              const diff = differenceInCalendarDays(nextDelivery, new Date())
              const timingLabel =
                diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`
              const supplierName = supplier?.name ?? 'Supplier'
              const threshold = formatCurrency(rule.free_threshold_ex_vat)
              const flatFee = formatCurrency(rule.flat_fee)
              const cutoff = parseTime(rule.cutoff_time)

              return (
                <li key={rule.id} className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{supplierName}</span>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs">{timingLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Next drop {format(nextDelivery, 'EEE d MMM')} • cutoff {cutoff.hours.toString().padStart(2, '0')}:{
                          cutoff.minutes.toString().padStart(2, '0')
                        }
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-1 min-w-[120px]">
                      {threshold ? <p>Free over {threshold}</p> : null}
                      {flatFee ? <p>Delivery fee {flatFee}</p> : <p>Delivery fee included</p>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingDeliveriesCard
