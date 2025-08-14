
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff } from 'lucide-react'

export function PriceNotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [priceChangeThreshold, setPriceChangeThreshold] = useState([5])
  const [stockAlerts, setStockAlerts] = useState(true)
  const [priceDropAlerts, setPriceDropAlerts] = useState(true)
  const [priceIncreaseAlerts, setPriceIncreaseAlerts] = useState(true)

  const handleSave = () => {
    // Save settings to localStorage or backend
    const settings = {
      notificationsEnabled,
      priceChangeThreshold: priceChangeThreshold[0],
      stockAlerts,
      priceDropAlerts,
      priceIncreaseAlerts
    }
    
    localStorage.setItem('price-notification-settings', JSON.stringify(settings))
    console.log('Price notification settings saved:', settings)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Price Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled" className="text-base">
              Enable Price Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when prices change significantly
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        {notificationsEnabled && (
          <>
            {/* Price Change Threshold */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price Change Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Only notify for price changes above this percentage
                </p>
              </div>
              <div className="space-y-3">
                <Slider
                  value={priceChangeThreshold}
                  onValueChange={setPriceChangeThreshold}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">1%</span>
                  <Badge variant="outline">
                    {priceChangeThreshold[0]}% threshold
                  </Badge>
                  <span className="text-sm text-muted-foreground">50%</span>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              <Label>Notification Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-drops" className="text-sm">
                      Price Drops
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When prices decrease
                    </p>
                  </div>
                  <Switch
                    id="price-drops"
                    checked={priceDropAlerts}
                    onCheckedChange={setPriceDropAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-increases" className="text-sm">
                      Price Increases
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When prices increase
                    </p>
                  </div>
                  <Switch
                    id="price-increases"
                    checked={priceIncreaseAlerts}
                    onCheckedChange={setPriceIncreaseAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="stock-changes" className="text-sm">
                      Stock Changes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When items go in/out of stock
                    </p>
                  </div>
                  <Switch
                    id="stock-changes"
                    checked={stockAlerts}
                    onCheckedChange={setStockAlerts}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Notification Settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
