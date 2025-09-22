import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '0%'
  const rounded = Number.parseFloat(value.toFixed(1))
  const prefix = rounded > 0 ? '+' : ''
  return `${prefix}${rounded}%`
}

const changeTone = (value: number) =>
  value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-muted-foreground'

const ChangeIcon = ({ value }: { value: number }) => {
  if (value > 0) return <TrendingUp className="h-4 w-4" />
  if (value < 0) return <TrendingDown className="h-4 w-4" />
  return <Minus className="h-4 w-4" />
}

export function SpendSnapshot() {
  const { data, isLoading } = useSpendSnapshot()

  const maxSparkValue = data?.sparkline?.reduce((max, point) => Math.max(max, point.value), 0) ?? 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Spend snapshot</CardTitle>
        <p className="text-sm text-muted-foreground">
          This week’s procurement compared with last week, so you can course-correct early.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-6">
        {isLoading ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground">
            Loading spend overview…
          </div>
        ) : !data ? (
          <div className="flex-1 grid place-content-center text-sm text-muted-foreground">
            Connect suppliers to start tracking spend.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Spend this week</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold">
                    {formatCurrency(data.thisWeek)}
                  </span>
                  <span className={`inline-flex items-center gap-2 text-sm font-medium ${changeTone(data.change)}`}>
                    <ChangeIcon value={data.change} />
                    {formatPercent(data.change)}
                    <span className="text-muted-foreground">vs last week</span>
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data.ordersThisWeek > 0
                    ? `${data.ordersThisWeek} order${data.ordersThisWeek === 1 ? '' : 's'} placed`
                    : 'No orders dispatched yet this week'}
                </p>
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-end gap-1 h-20">
                  {data.sparkline.map((point) => {
                    const height = maxSparkValue > 0 ? Math.max((point.value / maxSparkValue) * 100, 6) : 6
                    return (
                      <div key={point.label} className="flex-1 relative">
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-full bg-primary/70"
                          style={{ height: `${height}%` }}
                          aria-hidden="true"
                        />
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                          {point.label.charAt(0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Rolling 7-day spend, tallest bar is {formatCurrency(maxSparkValue || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Top categories</p>
              {data.categories.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Categorise your catalogue to see category trends here.
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.categories.map((category) => (
                    <li key={category.name} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className={`text-xs font-medium ${changeTone(category.change)}`}>
                          <span className="inline-flex items-center gap-1">
                            <ChangeIcon value={category.change} />
                            {formatPercent(category.change)}
                          </span>
                          <span className="text-muted-foreground"> vs last week</span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold font-mono">
                        {formatCurrency(category.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SpendSnapshot
