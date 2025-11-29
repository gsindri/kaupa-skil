import { useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { ToastAction } from '@/components/ui/toast'

const RECOVERY_STORAGE_KEY = 'procurewise-cart-recovery'
const RECOVERY_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CartSnapshot {
  items: CartItem[]
  timestamp: number
  operation: string
}

export function useCartRecovery(
  currentItems: CartItem[],
  restoreItems: (items: CartItem[]) => void,
  cartMode: 'anonymous' | 'hydrating' | 'authenticated'
) {
  const { toast } = useToast()
  const snapshotRef = useRef<CartSnapshot | null>(null)

  // Check for recovery data on mount
  useEffect(() => {
    if (cartMode === 'hydrating') return // Don't check during hydration

    try {
      const stored = localStorage.getItem(RECOVERY_STORAGE_KEY)
      if (!stored) return

      const snapshot: CartSnapshot = JSON.parse(stored)
      const age = Date.now() - snapshot.timestamp

      // Expired snapshot
      if (age > RECOVERY_EXPIRY_MS) {
        localStorage.removeItem(RECOVERY_STORAGE_KEY)
        return
      }

      // Valid recovery data found
      if (snapshot.items.length > 0 && currentItems.length === 0) {
        const itemCount = snapshot.items.length
        const itemText = itemCount > 1 ? 'items' : 'item'
        
        toast({
          title: 'Cart Recovery Available',
          description: `We found ${itemCount} ${itemText} from a previous session.`,
          action: (
            <ToastAction
              altText="Restore cart"
              onClick={() => {
                restoreItems(snapshot.items)
                localStorage.removeItem(RECOVERY_STORAGE_KEY)
                toast({
                  description: 'Cart restored successfully'
                })
              }}
            >
              Restore
            </ToastAction>
          ),
          duration: 10000
        })
      } else if (snapshot.items.length > 0) {
        // Items exist but cart is not empty - clear old recovery
        localStorage.removeItem(RECOVERY_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to check cart recovery:', error)
      localStorage.removeItem(RECOVERY_STORAGE_KEY)
    }
  }, [cartMode, currentItems.length, restoreItems, toast])

  // Save snapshot before risky operation
  const saveSnapshot = useCallback((operation: string) => {
    const snapshot: CartSnapshot = {
      items: currentItems.map(item => ({ ...item })),
      timestamp: Date.now(),
      operation
    }
    snapshotRef.current = snapshot

    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.error('Failed to save cart snapshot:', error)
    }
  }, [currentItems])

  // Recover from snapshot after error
  const recoverFromSnapshot = useCallback((errorMessage?: string) => {
    const snapshot = snapshotRef.current

    if (!snapshot) {
      console.warn('No snapshot available for recovery')
      return false
    }

    try {
      restoreItems(snapshot.items)
      
      const description = errorMessage 
        ? `Operation failed: ${errorMessage}. Your cart has been restored.`
        : 'Your cart has been restored to its previous state.'
      
      toast({
        title: 'Cart Recovered',
        description,
        variant: 'default'
      })

      // Clear recovery data after successful recovery
      localStorage.removeItem(RECOVERY_STORAGE_KEY)
      snapshotRef.current = null
      
      return true
    } catch (error) {
      console.error('Failed to recover cart:', error)
      return false
    }
  }, [restoreItems, toast])

  // Clear snapshot after successful operation
  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null
    try {
      localStorage.removeItem(RECOVERY_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear cart snapshot:', error)
    }
  }, [])

  return {
    saveSnapshot,
    recoverFromSnapshot,
    clearSnapshot
  }
}
