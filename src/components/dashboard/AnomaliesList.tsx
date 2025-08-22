
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, AlertTriangle, Package } from 'lucide-react'
import { usePriceAnomalies } from '@/hooks/usePriceAnomalies'

export function AnomaliesList() {
  const { anomalies, isLoading } = usePriceAnomalies()

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'drop':
        return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
      case 'volatile':
        return <Package className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getImpactVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'outline'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price & Stock Anomalies</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading anomalies...</div>
        ) : anomalies.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No anomalies found</div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getAnomalyIcon(anomaly.type)}
                  <div className="space-y-1">
                    <div className="font-medium">{anomaly.itemName}</div>
                    <div className="text-sm text-muted-foreground">{anomaly.supplier}</div>
                    <div className="text-sm">{anomaly.description}</div>
                    <div className="text-xs text-muted-foreground">{new Date(anomaly.detectedAt).toLocaleString('is-IS')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getImpactVariant(anomaly.severity)} className="text-xs">
                    {anomaly.severity}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
