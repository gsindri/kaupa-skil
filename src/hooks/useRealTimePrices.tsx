
import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface PriceUpdate {
  supplier_item_id: string
  old_price: number
  new_price: number
  supplier_name: string
  item_name: string
  change_percentage: number
  timestamp: string
}

interface PriceAlert {
  id: string
  type: 'price_drop' | 'price_increase' | 'back_in_stock' | 'out_of_stock'
  message: string
  timestamp: string
  data: PriceUpdate
}

export function useRealTimePrices() {
  const [isConnected, setIsConnected] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [recentUpdates, setRecentUpdates] = useState<PriceUpdate[]>([])
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    console.log('Setting up real-time price updates subscription')
    
    // Subscribe to price updates via Supabase Realtime
    const channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_items',
          filter: 'price_ex_vat=neq.prev(price_ex_vat)'
        },
        (payload) => {
          console.log('Price update received:', payload)
          handlePriceUpdate(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_items',
          filter: 'in_stock=neq.prev(in_stock)'
        },
        (payload) => {
          console.log('Stock update received:', payload)
          handleStockUpdate(payload)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      console.log('Cleaning up price updates subscription')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const handlePriceUpdate = (payload: any) => {
    const { new: newRecord, old: oldRecord } = payload
    
    if (!newRecord || !oldRecord) return

    const priceChange = newRecord.price_ex_vat - oldRecord.price_ex_vat
    const changePercentage = ((priceChange / oldRecord.price_ex_vat) * 100)
    
    const update: PriceUpdate = {
      supplier_item_id: newRecord.id,
      old_price: oldRecord.price_ex_vat,
      new_price: newRecord.price_ex_vat,
      supplier_name: newRecord.supplier_name || 'Unknown Supplier',
      item_name: newRecord.name || 'Unknown Item',
      change_percentage: changePercentage,
      timestamp: new Date().toISOString()
    }

    setRecentUpdates(prev => [update, ...prev.slice(0, 19)]) // Keep last 20 updates

    // Create alert for significant price changes (>5%)
    if (Math.abs(changePercentage) > 5) {
      const alert: PriceAlert = {
        id: `price-${newRecord.id}-${Date.now()}`,
        type: priceChange > 0 ? 'price_increase' : 'price_drop',
        message: `${newRecord.name} price ${priceChange > 0 ? 'increased' : 'dropped'} by ${Math.abs(changePercentage).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        data: update
      }

      setAlerts(prev => [alert, ...prev.slice(0, 9)]) // Keep last 10 alerts

      // Show toast notification
      toast(alert.message, {
        description: `${newRecord.supplier_name}: ${oldRecord.price_ex_vat.toLocaleString()} ISK → ${newRecord.price_ex_vat.toLocaleString()} ISK`,
        duration: 5000,
      })
    }

    // Invalidate related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['supplier-items'] })
    queryClient.invalidateQueries({ queryKey: ['price-quotes'] })
  }

  const handleStockUpdate = (payload: any) => {
    const { new: newRecord, old: oldRecord } = payload
    
    if (!newRecord || !oldRecord) return
    if (newRecord.in_stock === oldRecord.in_stock) return

    const alert: PriceAlert = {
      id: `stock-${newRecord.id}-${Date.now()}`,
      type: newRecord.in_stock ? 'back_in_stock' : 'out_of_stock',
      message: `${newRecord.name} is ${newRecord.in_stock ? 'back in stock' : 'out of stock'}`,
      timestamp: new Date().toISOString(),
      data: {
        supplier_item_id: newRecord.id,
        old_price: newRecord.price_ex_vat,
        new_price: newRecord.price_ex_vat,
        supplier_name: newRecord.supplier_name || 'Unknown Supplier',
        item_name: newRecord.name || 'Unknown Item',
        change_percentage: 0,
        timestamp: new Date().toISOString()
      }
    }

    setAlerts(prev => [alert, ...prev.slice(0, 9)])

    // Show toast for stock changes
    toast(alert.message, {
      description: newRecord.supplier_name,
      duration: 3000,
    })

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['supplier-items'] })
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  return {
    isConnected,
    alerts,
    recentUpdates,
    clearAlerts,
    dismissAlert
  }
}
