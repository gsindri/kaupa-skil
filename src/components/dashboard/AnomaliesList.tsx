
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, AlertTriangle, Package } from 'lucide-react'

interface Anomaly {
  id: string
  type: 'price_spike' | 'stockout' | 'price_drop'
  item: string
  supplier: string
  description: string
  impact: 'high' | 'medium' | 'low'
  timestamp: string
}

const mockAnomalies: Anomaly[] = [
  {
    id: '1',
    type: 'price_spike',
    item: 'Extra Virgin Olive Oil',
    supplier: 'Véfkaupmenn',
    description: 'Price increased by 15% from last order',
    impact: 'high',
    timestamp: '2 hours ago'
  },
  {
    id: '2', 
    type: 'stockout',
    item: 'Icelandic Skyr Plain',
    supplier: 'Matfuglinn',
    description: 'Item marked as out of stock',
    impact: 'medium',
    timestamp: '4 hours ago'
  },
  {
    id: '3',
    type: 'price_drop',
    item: 'Organic Carrots',
    supplier: 'Nordic Fresh',
    description: 'Price dropped by 8% - good buying opportunity',
    impact: 'low',
    timestamp: '1 day ago'
  }
]

export function AnomaliesList() {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'price_spike':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'stockout':
        return <Package className="h-4 w-4 text-yellow-500" />
      case 'price_drop':
        return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getImpactVariant = (impact: string) => {
    switch (impact) {
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
        <div className="space-y-4">
          {mockAnomalies.map((anomaly) => (
            <div key={anomaly.id} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex items-start space-x-3">
                {getAnomalyIcon(anomaly.type)}
                <div className="space-y-1">
                  <div className="font-medium">{anomaly.item}</div>
                  <div className="text-sm text-muted-foreground">{anomaly.supplier}</div>
                  <div className="text-sm">{anomaly.description}</div>
                  <div className="text-xs text-muted-foreground">{anomaly.timestamp}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getImpactVariant(anomaly.impact)} className="text-xs">
                  {anomaly.impact}
                </Badge>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
