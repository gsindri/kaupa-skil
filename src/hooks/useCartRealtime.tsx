import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { CartItem } from '@/lib/types'
import type { CartConflict } from '@/components/cart/ConflictResolutionModal'

interface UseCartRealtimeOptions {
  enabled: boolean
  tenantId: string | null | undefined
  userId: string | null | undefined
  currentItems: CartItem[]
  pendingMutations: Set<string> // Track items with pending optimistic updates
}

export function useCartRealtime({ 
  enabled, 
  tenantId, 
  userId, 
  currentItems,
  pendingMutations 
}: UseCartRealtimeOptions) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const [conflicts, setConflicts] = useState<CartConflict[]>([])
  
  // Track item versions to detect conflicts
  const itemVersionsRef = useRef<Map<string, { quantity: number, timestamp: number }>>(new Map())

  // Update local item versions when items change
  useEffect(() => {
    currentItems.forEach(item => {
      itemVersionsRef.current.set(item.supplierItemId, {
        quantity: item.quantity,
        timestamp: Date.now()
      })
    })
  }, [currentItems])

  // Detect conflicts between local and remote changes
  const detectConflict = useCallback((
    supplierItemId: string,
    remoteItem: CartItem | null,
    changeType: 'update' | 'delete' | 'insert'
  ): CartConflict | null => {
    // If we have pending mutations for this item, check for conflicts
    if (!pendingMutations.has(supplierItemId)) {
      return null
    }

    const localItem = currentItems.find(item => item.supplierItemId === supplierItemId)
    const localVersion = itemVersionsRef.current.get(supplierItemId)

    // Conflict: Item was updated on both devices
    if (changeType === 'update' && localItem && remoteItem) {
      if (localItem.quantity !== remoteItem.quantity) {
        return {
          type: 'quantity_change',
          supplierItemId,
          itemName: localItem.itemName,
          localVersion: localItem,
          remoteVersion: remoteItem,
          timestamp: Date.now()
        }
      }
    }

    // Conflict: Item was removed remotely but modified locally
    if (changeType === 'delete' && localItem && localVersion) {
      return {
        type: 'item_removed',
        supplierItemId,
        itemName: localItem.itemName,
        localVersion: localItem,
        remoteVersion: null,
        timestamp: Date.now()
      }
    }

    // Conflict: Item was added remotely while local changes pending
    if (changeType === 'insert' && remoteItem && localItem) {
      if (localItem.quantity !== remoteItem.quantity) {
        return {
          type: 'item_added',
          supplierItemId,
          itemName: remoteItem.itemName,
          localVersion: localItem,
          remoteVersion: remoteItem,
          timestamp: Date.now()
        }
      }
    }

    return null
  }, [currentItems, pendingMutations])

  const handleConflictResolution = useCallback((
    conflict: CartConflict,
    resolution: 'keep_local' | 'keep_remote' | 'merge'
  ) => {
    // Remove this conflict
    setConflicts(prev => prev.filter(c => c.supplierItemId !== conflict.supplierItemId))

    // Apply resolution
    if (resolution === 'keep_remote') {
      // Invalidate to fetch fresh data from server
      queryClient.invalidateQueries({ queryKey: ['cart', tenantId] })
    } else if (resolution === 'keep_local') {
      // Local version already in place, just clear the conflict
      // The next sync will push local changes to server
    }
    // 'merge' could be implemented for more complex scenarios

    toast({
      description: 'Conflict resolved',
      duration: 2000
    })
  }, [queryClient, tenantId, toast])

  const dismissConflict = useCallback(() => {
    setConflicts(prev => prev.slice(1))
  }, [])

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
          
          // Extract supplier_item_id from the payload
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          const supplierItemId = (newRecord?.supplier_product_id || oldRecord?.supplier_product_id) as string

          // Check for conflicts before applying changes
          if (supplierItemId) {
            let conflict: CartConflict | null = null

            if (payload.eventType === 'UPDATE') {
              // Build a CartItem from the new record for conflict detection
              const remoteItem: CartItem | null = newRecord ? {
                id: newRecord.id,
                supplierId: '', // Not available in order_lines
                supplierName: '',
                itemName: 'Item',
                sku: '',
                packSize: newRecord.pack_size || '',
                packPrice: newRecord.unit_price_per_pack,
                unitPriceExVat: null,
                unitPriceIncVat: null,
                quantity: newRecord.quantity_packs,
                vatRate: 0,
                unit: '',
                supplierItemId: supplierItemId,
                displayName: 'Item',
                packQty: 1,
                image: null
              } : null

              conflict = detectConflict(supplierItemId, remoteItem, 'update')
            } else if (payload.eventType === 'DELETE') {
              conflict = detectConflict(supplierItemId, null, 'delete')
            } else if (payload.eventType === 'INSERT') {
              const remoteItem: CartItem | null = newRecord ? {
                id: newRecord.id,
                supplierId: '',
                supplierName: '',
                itemName: 'Item',
                sku: '',
                packSize: newRecord.pack_size || '',
                packPrice: newRecord.unit_price_per_pack,
                unitPriceExVat: null,
                unitPriceIncVat: null,
                quantity: newRecord.quantity_packs,
                vatRate: 0,
                unit: '',
                supplierItemId: supplierItemId,
                displayName: 'Item',
                packQty: 1,
                image: null
              } : null

              conflict = detectConflict(supplierItemId, remoteItem, 'insert')
            }

            if (conflict) {
              // Add conflict to queue
              setConflicts(prev => [...prev, conflict!])
              return // Don't auto-apply changes when there's a conflict
            }
          }
          
          // No conflict, apply changes normally
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
  }, [enabled, tenantId, userId, queryClient, toast, detectConflict])

  return {
    isSubscribed: !!channelRef.current,
    conflicts,
    handleConflictResolution,
    dismissConflict
  }
}
