
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, AlertTriangle, Eye, Archive } from 'lucide-react'

interface PriceAnomalyAlertProps {
  anomaly: {
    id: string
    itemName: string
    supplier: string
    type: 'spike' | 'drop' | 'volatile'
    severity: 'low' | 'medium' | 'high'
    currentPrice: number
    previousPrice: number
    changePercent: number
    detectedAt: string
    description: string
  }
  onView: (id: string) => void
  onDismiss: (id: string) => void
}

export function PriceAnomalyAlert({ anomaly, onView, onDismiss }: PriceAnomalyAlertProps) {
  const getTypeIcon = () => {
    switch (anomaly.type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'drop':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'volatile':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTypeColor = () => {
    switch (anomaly.type) {
      case 'spike':
        return 'text-red-600'
      case 'drop':
        return 'text-green-600'
      case 'volatile':
        return 'text-yellow-600'
    }
  }

  const getSeverityVariant = () => {
    switch (anomaly.severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? '+' : ''
    return `${sign}${percent.toFixed(1)}%`
  }

  return (
    <Alert className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getTypeIcon()}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{anomaly.itemName}</span>
              <Badge variant="outline" className="text-xs">
                {anomaly.supplier}
              </Badge>
              <Badge variant={getSeverityVariant()} className="text-xs">
                {anomaly.severity}
              </Badge>
            </div>
            
            <AlertDescription className="text-sm">
              {anomaly.description}
            </AlertDescription>

            <div className="flex items-center space-x-4 text-sm">
              <div>
                <span className="text-muted-foreground">Previous: </span>
                <span>{formatPrice(anomaly.previousPrice)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="font-medium">{formatPrice(anomaly.currentPrice)}</span>
              </div>
              <div className={`font-medium ${getTypeColor()}`}>
                {formatPercent(anomaly.changePercent)}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Detected {new Date(anomaly.detectedAt).toLocaleString('is-IS')}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(anomaly.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"  
            onClick={() => onDismiss(anomaly.id)}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
