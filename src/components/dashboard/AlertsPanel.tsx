import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Bell } from 'lucide-react'
import { alertSeverityTokens } from './status-tokens'
import { useAlerts } from '@/hooks/useAlerts'

export function AlertsPanel() {
  const { alerts, isLoading } = useAlerts()

  const severityBreakdown = useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      },
      { high: 0, medium: 0, info: 0 } as Record<'high' | 'medium' | 'info', number>
    )
  }, [alerts])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Price spikes, stock-outs and invoices that need a quick look.
            </p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1">
            <Bell className="h-4 w-4" />
            Settings
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {(['high', 'medium', 'info'] as const).map((severity) => (
            <div key={severity} className="rounded-lg border bg-muted/40 p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {alertSeverityTokens[severity].label}
              </div>
              <div className="mt-1 text-xl font-semibold">{severityBreakdown[severity]}</div>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center space-y-2">
            <AlertTriangle className="mx-auto h-5 w-5" />
            <p className="font-medium text-foreground">All quiet</p>
            <p>We’ll raise price jumps, stockouts and invoice tasks here as they happen.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => (
              <li key={a.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={`${alertSeverityTokens[a.severity].badge}`}>
                      {alertSeverityTokens[a.severity].label}
                    </Badge>
                    <span className="font-medium">{a.supplier}</span>
                    <span className="text-muted-foreground">{a.sku}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.summary} • {new Date(a.created_at).toLocaleString('is-IS')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    Add to cart
                  </Button>
                  <Button size="sm" variant="ghost">Dismiss</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsPanel
