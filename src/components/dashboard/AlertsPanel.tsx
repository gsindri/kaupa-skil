import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell } from 'lucide-react'
import { alertSeverityTokens } from './status-tokens'
import type { AlertItem } from '@/hooks/useAlerts'

interface AlertsPanelProps {
  alerts: AlertItem[]
  isLoading: boolean
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">Keeping an eye on spikes and shortages.</p>
          </div>
          <Button size="sm" variant="ghost" className="gap-2">
            <Bell className="h-4 w-4" />
            Settings
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-6 pt-0">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-dashed border-muted/60 p-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const visibleAlerts = alerts.slice(0, 5)

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Alerts</CardTitle>
          <p className="text-sm text-muted-foreground">Heads-ups that need a human glance.</p>
        </div>
        <Button size="sm" variant="ghost" className="gap-2">
          <Bell className="h-4 w-4" />
          Settings
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {visibleAlerts.map((alert) => (
            <li key={alert.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className={`text-xs ${alertSeverityTokens[alert.severity].badge}`}>
                    {alertSeverityTokens[alert.severity].label}
                  </Badge>
                  <span className="font-medium text-foreground">{alert.supplier}</span>
                  <span className="text-xs text-muted-foreground">{alert.sku}</span>
                </div>
                <p className="text-xs text-muted-foreground">{alert.summary}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString('is-IS')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  Review
                </Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default AlertsPanel
