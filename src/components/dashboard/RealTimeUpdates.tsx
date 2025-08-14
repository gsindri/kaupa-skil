
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface RealTimeUpdate {
  id: string
  type: 'price_update' | 'stock_change' | 'new_item' | 'supplier_connect'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'success'
}

export function RealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Set up realtime subscription for price quotes
    const channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_quotes'
        },
        (payload) => {
          console.log('Price update received:', payload)
          
          const newUpdate: RealTimeUpdate = {
            id: Date.now().toString(),
            type: 'price_update',
            message: `Price updated for item`,
            timestamp: new Date().toISOString(),
            severity: 'info'
          }
          
          setUpdates(prev => [newUpdate, ...prev.slice(0, 9)]) // Keep last 10 updates
          setLastUpdate(new Date())
          
          toast({
            title: 'Price Update',
            description: 'New price data has been received',
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_items'
        },
        (payload) => {
          console.log('Supplier item update:', payload)
          
          const newUpdate: RealTimeUpdate = {
            id: Date.now().toString(),
            type: payload.eventType === 'INSERT' ? 'new_item' : 'stock_change',
            message: payload.eventType === 'INSERT' ? 'New item added' : 'Stock status changed',
            timestamp: new Date().toISOString(),
            severity: 'success'
          }
          
          setUpdates(prev => [newUpdate, ...prev.slice(0, 9)])
          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [toast])

  const getUpdateIcon = (type: RealTimeUpdate['type']) => {
    switch (type) {
      case 'price_update':
        return <Activity className="h-3 w-3" />
      case 'stock_change':
        return <RefreshCw className="h-3 w-3" />
      case 'new_item':
        return <Activity className="h-3 w-3" />
      case 'supplier_connect':
        return <Wifi className="h-3 w-3" />
    }
  }

  const getSeverityColor = (severity: RealTimeUpdate['severity']) => {
    switch (severity) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
    }
  }

  const reconnect = () => {
    window.location.reload() // Simple reconnection strategy
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Updates</CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString('is-IS')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!isConnected && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Connection lost
            </p>
            <Button size="sm" variant="outline" onClick={reconnect}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          </div>
        )}

        {updates.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No recent updates</p>
            <p className="text-xs">Updates will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {updates.map((update) => (
              <div
                key={update.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/20"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div className={getSeverityColor(update.severity)}>
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{update.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(update.timestamp).toLocaleTimeString('is-IS')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
