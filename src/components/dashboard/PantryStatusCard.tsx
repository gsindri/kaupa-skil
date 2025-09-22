import React, { useMemo } from 'react'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePantrySignals } from '@/hooks/usePantrySignals'

const statusToken = (daysSince: number | null) => {
  if (daysSince === null) {
    return { label: 'New item', badge: 'bg-blue-50 text-blue-600 border-blue-200' }
  }
  if (daysSince >= 28) {
    return { label: 'Restock now', badge: 'bg-rose-50 text-rose-600 border-rose-200' }
  }
  if (daysSince >= 14) {
    return { label: 'Due soon', badge: 'bg-amber-50 text-amber-600 border-amber-200' }
  }
  return { label: 'Healthy', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
}

export function PantryStatusCard() {
  const { items, isLoading } = usePantrySignals()

  const restockCandidates = useMemo(() => {
    return items
      .map((item) => {
        const lastOrderedDate = item.lastOrderedAt ? new Date(item.lastOrderedAt) : null
        const daysSince = lastOrderedDate ? differenceInDays(new Date(), lastOrderedDate) : null
        return {
          ...item,
          lastOrderedDate,
          daysSince,
        }
      })
      .sort((a, b) => (b.daysSince ?? -1) - (a.daysSince ?? -1))
      .slice(0, 5)
  }, [items])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Pantry watchlist</CardTitle>
        <p className="text-sm text-muted-foreground">
          Flagged items that look ready for a top-up, right from your recent ordering history.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground">
            Checking pantry signals…
          </div>
        ) : restockCandidates.length === 0 ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground">
            We’ll highlight pantry items here once orders start flowing in.
          </div>
        ) : (
          <ul className="space-y-3">
            {restockCandidates.map((item) => {
              const token = statusToken(item.daysSince ?? null)
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <Badge className={`text-xs ${token.badge}`}>{token.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.lastOrderedDate
                        ? `Last ordered ${formatDistanceToNow(item.lastOrderedDate, { addSuffix: true })}`
                        : 'Never ordered in this workspace'}
                      {item.lastQuantity ? ` • ${item.lastQuantity} packs last time` : ''}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Ordered {item.orderCount} time{item.orderCount === 1 ? '' : 's'} recently
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => console.info('Add to cart', item.id)}>
                    Add to cart
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="rounded-lg border border-dashed bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Expiry watch</p>
          <p className="text-xs text-muted-foreground mt-1">
            Track use-by dates from the pantry page to surface expiring products here.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PantryStatusCard
