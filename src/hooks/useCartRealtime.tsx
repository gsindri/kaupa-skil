import { useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseCartRealtimeOptions {
  enabled: boolean
  tenantId: string | null | undefined
  userId: string | null | undefined
}

export function useCartRealtime({ enabled, tenantId, userId }: UseCartRealtimeOptions) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    // Only subscribe if enabled and we have tenant/user info
    if (!enabled || !tenantId || !userId) {
      return
    }

    // Debounce rapid updates (e.g., from our own actions)
    const DEBOUNCE_MS = 1000

    // Create a unique channel for this tenant's cart
    const channel = supabase
      .channel(`cart-sync-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const now = Date.now()
          
          // Skip if this is our own recent change
          if (now - lastUpdateRef.current < DEBOUNCE_MS) {
            return
          }
          
          lastUpdateRef.current = now

          console.log('Cart order changed:', payload)
          
          // Invalidate cart query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['cart', tenantId] })
          
          // Show toast notification for changes from other devices/sessions
          if (payload.eventType === 'INSERT') {
            toast({
              description: 'New order synced from another device',
              duration: 3000,
            })
          } else if (payload.eventType === 'UPDATE') {
            // Only notify for draft orders (cart items)
            const newRecord = payload.new as any
            if (newRecord?.status === 'draft') {
              toast({
                description: 'Cart updated from another device',
                duration: 3000,
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_lines',
        },
        (payload) => {
          const now = Date.now()
          
          // Skip if this is our own recent change
          if (now - lastUpdateRef.current < DEBOUNCE_MS) {
            return
          }
          
          lastUpdateRef.current = now

          console.log('Cart item changed:', payload)
          
          // Invalidate cart query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['cart', tenantId] })
          
          // Show toast for item changes
          if (payload.eventType === 'INSERT') {
            toast({
              description: 'Item added from another device',
              duration: 3000,
            })
          } else if (payload.eventType === 'UPDATE') {
            toast({
              description: 'Cart quantity updated from another device',
              duration: 3000,
            })
          } else if (payload.eventType === 'DELETE') {
            toast({
              description: 'Item removed from another device',
              duration: 3000,
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Cart realtime sync active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Cart realtime subscription error')
        }
      })

    channelRef.current = channel

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, tenantId, userId, queryClient, toast])

  return {
    isSubscribed: !!channelRef.current,
  }
}
