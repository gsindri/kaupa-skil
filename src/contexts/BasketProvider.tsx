import React, { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext, type CartMode } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'
import { getCachedImageUrl } from '@/services/ImageCache'
import { useMutation, useQueryClient, useIsMutating } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import {
  useMergeAnonymousCart,
  useAddToCartDB,
  useUpdateCartItemDB,
  useRemoveCartItemDB,
  useRemoveProductFromCartDB,
  useUpdateProductQuantityDB
} from '@/hooks/useCartMutations'
import { useLoadCartFromDB } from '@/hooks/useLoadCartFromDB'
import { useCartRecovery } from '@/hooks/useCartRecovery'
import { useCartRealtime } from '@/hooks/useCartRealtime'

const CART_STORAGE_KEY = 'procurewise-basket'
const CART_PIN_STORAGE_KEY = 'procurewise-cart-pinned'
const ANONYMOUS_CART_ID_KEY = 'procurewise-anonymous-cart-id'

const PLACEHOLDER_SUPPLIER_NAMES = new Set([
  '??',
  'unknown',
  'unknown supplier',
  'unknown vendor',
  'n/a',
  'na',
  'tbd',
  'none',
  'unspecified'
])

const WORD_PATTERN = /(\p{L})([\p{L}\p{M}]*)/gu

const toSmartTitleCase = (value: string): string => {
  const normalized = value.toLocaleLowerCase('is-IS')
  return normalized.replace(WORD_PATTERN, (_, first: string, rest: string) =>
    first.toLocaleUpperCase('is-IS') + rest
  )
}

const sanitizeSupplierName = (
  candidate: unknown,
  fallbackId?: unknown
): string => {
  const normalize = (value: unknown) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

  const candidateName = normalize(candidate)
  const fallbackCandidate = normalize(fallbackId)
  const fallback =
    fallbackCandidate &&
      !PLACEHOLDER_SUPPLIER_NAMES.has(fallbackCandidate.toLowerCase())
      ? fallbackCandidate
      : 'Supplier'

  if (!candidateName) {
    return fallback
  }

  const lowerCandidate = candidateName.toLowerCase()
  if (PLACEHOLDER_SUPPLIER_NAMES.has(lowerCandidate)) {
    return fallback
  }

  const isUniformCase =
    candidateName === candidateName.toLowerCase() ||
    candidateName === candidateName.toUpperCase()

  if (isUniformCase && candidateName.length > 2) {
    return toSmartTitleCase(candidateName)
  }

  return candidateName
}

const extractLegacySupplierName = (it: any): string => {
  const supplierIdCandidate =
    it?.supplierId ??
    it?.supplier_id ??
    it?.supplier?.id ??
    it?.vendorId ??
    it?.vendor_id ??
    it?.vendor?.id ??
    it?.supplierItemId ??
    it?.id

  const supplierNameCandidate =
    it?.supplierName ??
    it?.supplier_name ??
    it?.supplier?.name ??
    it?.supplier?.supplierName ??
    it?.supplier?.displayName ??
    it?.supplier?.company?.name ??
    it?.supplier?.company_name ??
    it?.vendorName ??
    it?.vendor_name ??
    it?.vendor?.name ??
    it?.vendor?.companyName ??
    it?.companyName ??
    it?.metadata?.supplierName

  return sanitizeSupplierName(supplierNameCandidate, supplierIdCandidate)
}
export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, profileLoading, isInitialized } = useAuth()
  const mergeCart = useMergeAnonymousCart()
  const { data: dbCart, isLoading: isLoadingDBCart, isFetching: isFetchingDBCart, error: dbCartError } = useLoadCartFromDB()
  const isMutating = useIsMutating({ mutationKey: ['cart'] }) // Track any cart mutations

  // Database mutation hooks for authenticated cart persistence
  const addToCartDB = useAddToCartDB()
  const updateCartItemDB = useUpdateCartItemDB()
  const removeCartItemDB = useRemoveCartItemDB()
  const removeProductFromCartDB = useRemoveProductFromCartDB()
  const updateProductQuantityDB = useUpdateProductQuantityDB()

  // State machine for cart mode
  const [mode, setMode] = useState<CartMode>('anonymous')
  const [items, setItems] = useState<CartItem[]>([])

  // Cart recovery system
  const { saveSnapshot, recoverFromSnapshot, clearSnapshot } = useCartRecovery(
    items,
    restoreItems,
    mode
  )

  // Real-time cart sync across devices for authenticated users
  const { isSubscribed } = useCartRealtime({
    enabled: mode === 'authenticated',
    tenantId: profile?.tenant_id,
    userId: user?.id,
  })

  // Master effect: State machine for cart mode transitions
  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) return

    // ANONYMOUS MODE: no user logged in
    // If user is present but profile is loading, we wait (don't switch to anonymous)
    if (!user) {
      if (mode !== 'anonymous') {
        setMode('anonymous')
        setItems([])
        localStorage.removeItem(CART_STORAGE_KEY)
        localStorage.removeItem(ANONYMOUS_CART_ID_KEY)
      }

      // Load from localStorage only on mount for anonymous users
      if (mode === 'anonymous' && items.length === 0) {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
          try {
            const parsed: any[] = JSON.parse(saved)
            const loadedItems = parsed.map(it => ({
              ...it,
              supplierItemId: it.supplierItemId ?? it.id,
              supplierLogoUrl: (() => {
                const logoCandidate =
                  it.supplierLogoUrl ??
                  it.supplier_logo_url ??
                  it.logoUrl ??
                  it.supplierLogo ??
                  null
                return logoCandidate ? getCachedImageUrl(logoCandidate) : null
              })(),
              supplierName: extractLegacySupplierName(it),
              itemName:
                it.itemName ??
                it.name ??
                it.title ??
                it.productName,
              displayName:
                it.displayName ??
                it.itemName ??
                it.name ??
                it.title ??
                it.productName,
              // ...
            }))
            setItems(loadedItems)
          } catch {
            // Ignore parse errors
          }
        }
      }
      return
    }

    // HYDRATING MODE: user logged in, need to merge carts
    if (mode === 'anonymous') {
      setMode('hydrating')
      return
    }

    if (mode === 'hydrating') {
      // Wait for profile to be fully loaded
      // We know user is present, so we must have a profile before proceeding
      if (!profile) {
        return
      }

      // If we have a profile, we must wait for the DB cart to load
      if (profile.tenant_id) {
        if (isLoadingDBCart) return
        // If data is missing and no error, we are probably initializing the query or waiting for network
        if (!dbCart && !dbCartError) return
      }

      // Get local anonymous cart snapshot
      const anonymousCartId = localStorage.getItem(ANONYMOUS_CART_ID_KEY)
      const localItems = items.length > 0 ? items : (() => {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
          try {
            const parsed: any[] = JSON.parse(saved)
            return parsed.map(it => ({
              ...it,
              supplierItemId: it.supplierItemId ?? it.id,
              supplierLogoUrl: (() => {
                const logoCandidate =
                  it.supplierLogoUrl ??
                  it.supplier_logo_url ??
                  it.logoUrl ??
                  it.supplierLogo ??
                  null
                return logoCandidate ? getCachedImageUrl(logoCandidate) : null
              })(),
              supplierName: extractLegacySupplierName(it),
              itemName:
                it.itemName ??
                it.name ??
                it.title ??
                it.productName,
              displayName:
                it.displayName ??
                it.itemName ??
                it.name ??
                it.title ??
                it.productName,
            }))
          } catch {
            return []
          }
        }
        return []
      })()

      // Merge strategy
      if (anonymousCartId && localItems.length > 0) {
        // Merge anonymous cart with server cart
        mergeCart.mutate(
          { anonymousCartId, items: localItems },
          {
            onSuccess: () => {
              // Clear anonymous cart data
              localStorage.removeItem(ANONYMOUS_CART_ID_KEY)
              localStorage.removeItem(CART_STORAGE_KEY)
              // Switch to authenticated mode
              setMode('authenticated')
              setItems(dbCart || [])
            },
            onError: (error) => {
              console.error('Failed to merge cart:', error)
              // Fallback: just use DB cart
              setMode('authenticated')
              setItems(dbCart || [])
            },
          }
        )
      } else {
        // No local cart to merge, just use DB cart
        setMode('authenticated')
        setItems(dbCart || [])
      }
      return
    }

    // AUTHENTICATED MODE: server is boss, but respect local optimism
    if (mode === 'authenticated') {
      // Don't sync if we are currently mutating (optimistic updates in flight)
      // or if we are fetching fresh data (wait for it to settle)
      if (isMutating > 0 || isFetchingDBCart) {
        // console.log('Skipping sync:', { isMutating, isFetchingDBCart })
        return
      }

      // Only update if we have data and it's different (simple length check or deep compare if needed)
      // For now, we trust the DB cart if we are idle
      if (dbCart) {
        // Deduplicate items based on supplierItemId to prevent React key collisions and UI glitches
        const uniqueItems = dbCart.reduce((acc, item) => {
          if (!acc.some(i => i.supplierItemId === item.supplierItemId)) {
            acc.push(item)
          }
          return acc
        }, [] as CartItem[])

        setItems(uniqueItems)
      }
    }
  }, [user, profile?.tenant_id, mode, dbCart, isLoadingDBCart, isFetchingDBCart, isMutating, profileLoading, isInitialized])

  // Generate anonymous cart ID if not authenticated
  useEffect(() => {
    if (mode === 'anonymous' && items.length > 0) {
      const existingId = localStorage.getItem(ANONYMOUS_CART_ID_KEY)
      if (!existingId) {
        const newId = crypto.randomUUID()
        localStorage.setItem(ANONYMOUS_CART_ID_KEY, newId)
      }
    }
  }, [mode, items.length])

  const [isDrawerPinned, setIsDrawerPinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(CART_PIN_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [cartPulseSignal] = useState(0)
  const [drawerOpenExplicit, setDrawerOpenExplicit] = useState(false)
  const { toast } = useToast()

  const isDrawerOpen = isDrawerPinned || drawerOpenExplicit

  // Sync basket across tabs (only for anonymous users)
  useEffect(() => {
    if (mode !== 'anonymous') return // Only sync in anonymous mode

    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('procurewise-basket')
        : null

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BASKET_UPDATED') {
        setItems(event.data.items)
      }
    }

    channel?.addEventListener('message', handleMessage)
    return () => {
      channel?.removeEventListener('message', handleMessage)
      channel?.close()
    }
  }, [mode])

  // Fallback: cross-tab sync via storage events (only for anonymous users)
  useEffect(() => {
    if (mode !== 'anonymous') return // Only sync in anonymous mode

    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue))
        } catch {
          /* ignore parse errors */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [mode])

  const syncBasket = useCallback((() => {
    let timeout: number | undefined
    let latest: CartItem[] = []
    const send = (items: CartItem[]) => {
      // Only persist to localStorage in anonymous mode
      if (mode === 'anonymous') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('procurewise-basket')
          channel.postMessage({ type: 'BASKET_UPDATED', items })
          channel.close()
        }
      }
    }
    return (items: CartItem[]) => {
      latest = items
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => send(latest), 400)
    }
  })(), [mode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (isDrawerPinned) {
        window.localStorage.setItem(CART_PIN_STORAGE_KEY, '1')
      } else {
        window.localStorage.removeItem(CART_PIN_STORAGE_KEY)
      }
    } catch {
      /* ignore persistence errors */
    }
  }, [isDrawerPinned])

  useEffect(() => {
    if (isDrawerPinned) {
      setDrawerOpenExplicit(true)
    }
  }, [isDrawerPinned])

  const setIsDrawerOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        if (isDrawerPinned) {
          setDrawerOpenExplicit(true)
          return
        }

        setDrawerOpenExplicit(false)
        return
      }

      setDrawerOpenExplicit(true)
    },
    [isDrawerPinned]
  )

  const addItem = (
    item:
      | Omit<CartItem, 'quantity'>
      | { product_id: string; supplier_id: string; quantity?: number },
    quantity = 1,
    options: { showToast?: boolean; animateElement?: HTMLElement } = {}
  ) => {
    let normalizedItem: Omit<CartItem, 'quantity'>
    let finalQuantity = quantity

    if ('product_id' in item && 'supplier_id' in item) {
      const supplierName = sanitizeSupplierName(
        (item as any)?.supplier_name ?? (item as any)?.supplierName,
        item.supplier_id
      )
      normalizedItem = {
        id: item.product_id,
        supplierId: item.supplier_id,
        supplierName,
        supplierLogoUrl: null,
        itemName: 'Item',
        sku: '',
        packSize: '',
        packPrice: null,
        unitPriceExVat: null,
        unitPriceIncVat: null,
        vatRate: 0,
        unit: '',
        supplierItemId: item.product_id,
        displayName: 'Item',
        packQty: 1,
        image: null
      }
      if (item.quantity != null) {
        finalQuantity = item.quantity
      }
    } else {
      normalizedItem = {
        ...item,
        supplierName: sanitizeSupplierName(item.supplierName, item.supplierId),
        supplierLogoUrl: item.supplierLogoUrl
          ? getCachedImageUrl(item.supplierLogoUrl)
          : null,
        itemName: item.itemName ?? item.displayName ?? 'Item',
        displayName: item.displayName ?? item.itemName ?? 'Item',
        image: item.image ? getCachedImageUrl(item.image) : null
      }
    }

    const previousItems = items.map(i => ({ ...i }))
    if (options.animateElement) {
      flyToCart(options.animateElement)
    }
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.supplierItemId === normalizedItem.supplierItemId
      )

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = prev.map((basketItem, index) =>
          index === existingIndex
            ? { ...basketItem, quantity: basketItem.quantity + finalQuantity }
            : basketItem
        )
      } else {
        newItems = [...prev, { ...normalizedItem, quantity: finalQuantity }]
      }

      // Persist based on cart mode
      if (mode === 'anonymous') {
        syncBasket(newItems)
      } else if (mode === 'authenticated') {
        // Save snapshot before database operation
        saveSnapshot('add_item')
        
        // Persist to database
        const itemToAdd = newItems.find(i => i.supplierItemId === normalizedItem.supplierItemId)
        if (itemToAdd) {
          addToCartDB.mutate(
            { item: itemToAdd },
            {
              onSuccess: () => {
                clearSnapshot()
              },
              onError: (error) => {
                console.error('Failed to add item to cart:', error)
                recoverFromSnapshot('Failed to add item')
              }
            }
          )
        }
      }
      // If mode === 'hydrating', don't persist (wait for hydration to complete)

      if (options.showToast !== false) {
        toast({
          description: `Added ${normalizedItem.itemName} × ${finalQuantity}`,
          action: (
            <ToastAction altText="Undo" onClick={() => restoreItems(previousItems)}>
              Undo
            </ToastAction>
          )
        })
      }

      return newItems
    })

    setDrawerOpenExplicit(true)
  }

  const updateQuantity = (supplierItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(supplierItemId)
      return
    }
    setItems(prev => {
      const newQuantity = Math.max(1, quantity)
      const itemToUpdate = prev.find(item => item.supplierItemId === supplierItemId)

      const newItems = prev.map(item =>
        item.supplierItemId === supplierItemId
          ? { ...item, quantity: newQuantity }
          : item
      )

      // Persist based on cart mode
      if (mode === 'anonymous') {
        syncBasket(newItems)
      } else if (mode === 'authenticated' && itemToUpdate) {
        // Save snapshot before database operation
        saveSnapshot('update_quantity')
        
        // Persist to database using robust update (handles duplicates)
        updateProductQuantityDB.mutate(
          {
            supplierItemId: itemToUpdate.supplierItemId,
            supplierId: itemToUpdate.supplierId,
            quantity: newQuantity,
            packPrice: itemToUpdate.packPrice ?? null,
            packSize: itemToUpdate.packSize
          },
          {
            onSuccess: () => {
              clearSnapshot()
            },
            onError: (error) => {
              console.error('Failed to update quantity:', error)
              recoverFromSnapshot('Failed to update quantity')
            }
          }
        )
      }

      return newItems
    })
  }

  const removeItem = (supplierItemId: string) => {
    setItems(prev => {
      const previousItems = prev.map(i => ({ ...i }))
      const removed = prev.find(i => i.supplierItemId === supplierItemId)
      console.log('removeItem called:', { supplierItemId, found: !!removed, removedItem: removed })

      const newItems = prev.filter(item => item.supplierItemId !== supplierItemId)

      // Persist based on cart mode
      if (mode === 'anonymous') {
        syncBasket(newItems)
      } else if (mode === 'authenticated' && removed) {
        console.log('Triggering removeProductFromCartDB mutation:', {
          supplierItemId: removed.supplierItemId,
          supplierId: removed.supplierId,
          orderLineId: removed.orderLineId
        })
        
        // Save snapshot before database operation
        saveSnapshot('remove_item')
        
        // Persist to database using robust delete (removes all duplicates)
        removeProductFromCartDB.mutate(
          {
            supplierItemId: removed.supplierItemId,
            supplierId: removed.supplierId,
            orderLineId: removed.orderLineId // Pass orderLineId for fallback deletion
          },
          {
            onSuccess: () => {
              clearSnapshot()
            },
            onError: (error) => {
              console.error('Failed to remove item:', error)
              recoverFromSnapshot('Failed to remove item')
            }
          }
        )
      }

      if (removed) {
        toast({
          description: `${removed.itemName} removed from cart`,
          action: (
            <ToastAction altText="Undo" onClick={() => restoreItems(previousItems)}>
              Undo
            </ToastAction>
          ),
        })
      }
      return newItems
    })
  }

  const clearBasket = () => {
    setItems([])
    if (mode === 'anonymous') {
      syncBasket([])
    }
    // For authenticated mode, items will be cleared from DB when user explicitly deletes them
  }

  function restoreItems(items: CartItem[]) {
    setItems(items)
    if (mode === 'anonymous') {
      syncBasket(items)
    }
    // For authenticated mode, we don't restore to DB (only local optimistic update)
  }

  // Add clearCart method for backward compatibility
  const clearCart = clearBasket

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = (includeVat: boolean): number => {
    return items.reduce((total, item) => {
      const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      // Only add items with valid prices to the total
      return price != null ? total + (price * item.quantity) : total
    }, 0)
  }

  const getMissingPriceCount = () =>
    items.filter(i => i.unitPriceIncVat == null && i.unitPriceExVat == null).length

  // Check if there's a potential session in local storage
  const [hasLocalSession] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
    } catch {
      return false
    }
  })

  // Grace period for session restoration
  const [gracePeriod, setGracePeriod] = useState(hasLocalSession)

  useEffect(() => {
    if (!gracePeriod) return
    if (user) {
      setGracePeriod(false)
      return
    }
    const timer = setTimeout(() => setGracePeriod(false), 2000)
    return () => clearTimeout(timer)
  }, [gracePeriod, user])

  return (
    <BasketContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearBasket,
      clearCart,
      restoreItems,
      getTotalItems,
      getTotalPrice,
      getMissingPriceCount,
      isDrawerOpen,
      setIsDrawerOpen,
      isDrawerPinned,
      setIsDrawerPinned,
      cartPulseSignal,
      cartMode: mode,
      isHydrating: mode === 'hydrating' || !isInitialized || gracePeriod || profileLoading || (user && !profile) || (mode === 'authenticated' && isLoadingDBCart),
      isRealtimeSynced: isSubscribed
    }}>
      {children}
    </BasketContext.Provider>
  )
}
