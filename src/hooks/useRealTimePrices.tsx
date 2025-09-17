
import { useEffect, useState, useRef, useCallback } from 'react'
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

export function derivePriceChangeMetrics(
  oldPriceValue: number | null | undefined,
  newPriceValue: number | null | undefined
) {
  const oldPrice = Number(oldPriceValue ?? 0)
  const newPrice = Number(newPriceValue ?? 0)
  const priceChange = newPrice - oldPrice
  const hasValidBaseline = Number.isFinite(oldPrice) && oldPrice !== 0
  const hasValidPriceChange = Number.isFinite(priceChange)
  const changePercentage = hasValidBaseline
    ? (priceChange / oldPrice) * 100
    : hasValidPriceChange && priceChange !== 0
      ? Math.sign(priceChange) * 100
      : 0

  return { oldPrice, newPrice, priceChange, changePercentage }
}

// Connection manager to prevent rapid reconnections
class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager
  private channel: any = null
  private subscribers = new Set<string>()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false

  static getInstance() {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager()
    }
    return RealtimeConnectionManager.instance
  }

  subscribe(id: string, handlers: any) {
    this.subscribers.add(id)
    
    if (!this.channel && !this.isConnecting) {
      this.connect(handlers)
    }
    
    return () => this.unsubscribe(id)
  }

  private unsubscribe(id: string) {
    this.subscribers.delete(id)
    
    // If no more subscribers, disconnect after a delay
    if (this.subscribers.size === 0) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
      }
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.subscribers.size === 0 && this.channel) {
          supabase.removeChannel(this.channel)
          this.channel = null
        }
      }, 5000) // Wait 5 seconds before disconnecting
    }
  }

  private connect(handlers: any) {
    if (this.isConnecting || this.channel) return
    
    this.isConnecting = true
    
    this.channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_items',
          filter: 'price_ex_vat=neq.prev(price_ex_vat)'
        },
        handlers.handlePriceUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_items',
          filter: 'in_stock=neq.prev(in_stock)'
        },
        handlers.handleStockUpdate
      )
      .subscribe((status) => {
        this.isConnecting = false
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Real-time connection established')
          }
        } else if (status === 'CHANNEL_ERROR') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Real-time connection failed, retrying...')
          }
          // Retry connection after delay
          setTimeout(() => {
            this.channel = null
            if (this.subscribers.size > 0) {
              this.connect(handlers)
            }
          }, 2000)
        }
      })
  }
}

export function useRealTimePrices() {
  const [isConnected, setIsConnected] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [recentUpdates, setRecentUpdates] = useState<PriceUpdate[]>([])
  const queryClient = useQueryClient()
  const connectionManager = RealtimeConnectionManager.getInstance()
  const hookId = useRef(`price-hook-${Date.now()}-${Math.random()}`)

  // Throttle query invalidations to prevent spam
  const invalidateQueries = useRef(
    (() => {
      let timeout: NodeJS.Timeout | null = null
      return () => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['supplier-items'] })
          queryClient.invalidateQueries({ queryKey: ['price-quotes'] })
        }, 1000) // Batch invalidations over 1 second
      }
    })()
  )

  const handlePriceUpdate = useCallback((payload: any) => {
    const { new: newRecord, old: oldRecord } = payload
    
    if (!newRecord || !oldRecord) return

    const { oldPrice, newPrice, priceChange, changePercentage } = derivePriceChangeMetrics(
      oldRecord.price_ex_vat,
      newRecord.price_ex_vat
    )
    
    const update: PriceUpdate = {
      supplier_item_id: newRecord.id,
      old_price: oldPrice,
      new_price: newPrice,
      supplier_name: newRecord.supplier_name || 'Unknown Supplier',
      item_name: newRecord.name || 'Unknown Item',
      change_percentage: changePercentage,
      timestamp: new Date().toISOString()
    }

    setRecentUpdates(prev => [update, ...prev.slice(0, 19)])

    // Only create alerts for significant changes (>5%)
    const isFiniteChange = Number.isFinite(changePercentage)
    if (isFiniteChange && Math.abs(changePercentage) > 5) {
      const alert: PriceAlert = {
        id: `price-${newRecord.id}-${Date.now()}`,
        type: priceChange > 0 ? 'price_increase' : 'price_drop',
        message: `${newRecord.name} price ${priceChange > 0 ? 'increased' : 'dropped'} by ${Math.abs(changePercentage).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        data: update
      }

      setAlerts(prev => [alert, ...prev.slice(0, 9)])

      // Show toast notifications only for significant changes
      toast(alert.message, {
        description: `${newRecord.supplier_name}: ${oldPrice.toLocaleString()} ISK → ${newPrice.toLocaleString()} ISK`,
        duration: 3000,
      })
    }

    invalidateQueries.current()
  }, [])

  const handleStockUpdate = useCallback((payload: any) => {
    const { new: newRecord, old: oldRecord } = payload
    
    if (!newRecord || !oldRecord || newRecord.in_stock === oldRecord.in_stock) {
      return
    }

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

    toast(alert.message, {
      description: newRecord.supplier_name,
      duration: 2000,
    })

    invalidateQueries.current()
  }, [])

  useEffect(() => {
    const handlers = { handlePriceUpdate, handleStockUpdate }
    const unsubscribe = connectionManager.subscribe(hookId.current, handlers)
    
    // Set connected state optimistically
    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [handlePriceUpdate, handleStockUpdate, connectionManager])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    isConnected,
    alerts,
    recentUpdates,
    clearAlerts,
    dismissAlert
  }
}
