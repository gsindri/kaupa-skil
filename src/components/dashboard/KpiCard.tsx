import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/Sparkline'

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  trend?: number[]
  onClick?: () => void
}

export function KpiCard({ title, value, delta, trend = [], onClick }: KpiCardProps) {
  const deltaColor = delta === undefined ? 'text-muted-foreground' : delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'
  const deltaSymbol = delta === undefined ? '' : delta > 0 ? '▲' : delta < 0 ? '▼' : '■'

  return (
    <Card onClick={onClick} className="cursor-pointer hover:bg-muted/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          {delta !== undefined && (
            <span className={`text-xs ${deltaColor}`}>{deltaSymbol} {Math.abs(delta)}%</span>
          )}
          {trend.length > 0 && <Sparkline data={trend} />}
        </div>
      </CardContent>
    </Card>
  )
}
export default KpiCard
