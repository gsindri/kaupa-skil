import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alertSeverityTokens } from './status-tokens'
import { useAlerts } from '@/hooks/useAlerts'

export function AlertsPanel() {
  const { alerts, isLoading } = useAlerts()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No alerts</div>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => (
              <li key={a.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={`${alertSeverityTokens[a.severity].badge}`}>{alertSeverityTokens[a.severity].label}</Badge>
                    <span className="font-medium">{a.supplier}</span>
                    <span className="text-muted-foreground">{a.sku}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.summary} • {new Date(a.created_at).toLocaleString('is-IS')}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Add to cart</Button>
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
