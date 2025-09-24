import React, { useMemo } from 'react'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { PantrySignalItem } from '@/hooks/usePantrySignals'

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

interface PantryStatusCardProps {
  items: PantrySignalItem[]
  isLoading: boolean
}

export function PantryStatusCard({ items, isLoading }: PantryStatusCardProps) {
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

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-semibold">Pantry watchlist</CardTitle>
          <p className="text-sm text-muted-foreground">We’ll flag quick refills here.</p>
        </CardHeader>
        <CardContent className="space-y-3 p-6 pt-0">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (restockCandidates.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base font-semibold">Pantry watchlist</CardTitle>
        <p className="text-sm text-muted-foreground">Refills to keep on your radar.</p>
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {restockCandidates.map((item) => {
          const token = statusToken(item.daysSince ?? null)
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-muted/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
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
              <Button
                size="sm"
                variant="outline"
                className="whitespace-nowrap"
                onClick={() => console.info('Add to cart', item.id)}
              >
                Add to cart
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default PantryStatusCard
