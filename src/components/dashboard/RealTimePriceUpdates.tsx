
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Package, PackageX, Wifi, WifiOff, X, Trash2 } from 'lucide-react'
import { useRealTimePrices } from '@/hooks/useRealTimePrices'
import { formatDistanceToNow } from 'date-fns'

export function RealTimePriceUpdates() {
  const { isConnected, alerts, recentUpdates, clearAlerts, dismissAlert } = useRealTimePrices()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'price_increase':
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'back_in_stock':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'out_of_stock':
        return <PackageX className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'price_drop':
        return 'bg-green-50 border-green-200'
      case 'price_increase':
        return 'bg-red-50 border-red-200'
      case 'back_in_stock':
        return 'bg-blue-50 border-blue-200'
      case 'out_of_stock':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Price Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            Price Alerts
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
              {isConnected ? 'Live' : 'Disconnected'}
            </Badge>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAlerts}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent alerts. You'll be notified of significant price changes.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)} relative`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="flex items-start gap-3 pr-6">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {alert.data.supplier_name}
                        </p>
                        {alert.type.includes('price') && (
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(alert.data.old_price)} → {formatPrice(alert.data.new_price)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Price Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent price updates.
              </p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{update.item_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {update.supplier_name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1">
                        {update.change_percentage > 0 ? (
                          <TrendingUp className="h-3 w-3 text-red-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-green-600" />
                        )}
                        <Badge
                          variant={update.change_percentage > 0 ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {update.change_percentage > 0 ? '+' : ''}
                          {update.change_percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(update.new_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
