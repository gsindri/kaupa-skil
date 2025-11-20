import React, { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'
import { getCachedImageUrl } from '@/services/ImageCache'
import { useAuth } from './useAuth'
import { useMergeAnonymousCart } from '@/hooks/useCartMutations'
import { useLoadCartFromDB } from '@/hooks/useLoadCartFromDB'

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
  const { user, profile } = useAuth()
  const mergeCart = useMergeAnonymousCart()
  const { data: dbCart, isLoading: isLoadingDBCart } = useLoadCartFromDB()
  
  // Start with empty cart - will load from localStorage for anonymous users or DB for authenticated
  const [items, setItems] = useState<CartItem[]>([])
  
  const [mergeProcessed, setMergeProcessed] = useState<string | null>(null)

  // Load from localStorage only for anonymous users on mount
  useEffect(() => {
    if (!user) {
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
          }))
          setItems(loadedItems)
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [user])

  // Generate anonymous cart ID if not authenticated
  useEffect(() => {
    if (!user && items.length > 0) {
      const existingId = localStorage.getItem(ANONYMOUS_CART_ID_KEY)
      if (!existingId) {
        const newId = crypto.randomUUID()
        localStorage.setItem(ANONYMOUS_CART_ID_KEY, newId)
      }
    }
  }, [user, items.length])

  // Load cart from DB for authenticated users
  useEffect(() => {
    if (!user || !profile?.tenant_id || isLoadingDBCart) return
    
    const userSessionKey = `${user.id}-${profile.tenant_id}`
    
    // Check if merge was already processed for this login session
    if (mergeProcessed === userSessionKey) {
      // Already merged/loaded for this session, always sync with DB (even if empty)
      setItems(dbCart || [])
      return
    }
    
    // First time loading for this session - check for anonymous cart
    const anonymousCartId = localStorage.getItem(ANONYMOUS_CART_ID_KEY)
    const localItems = items
    
    if (anonymousCartId && localItems.length > 0) {
      // Merge anonymous cart with DB cart
      mergeCart.mutate(
        { anonymousCartId, items: localItems },
        {
          onSuccess: () => {
            // Clear anonymous cart
            localStorage.removeItem(ANONYMOUS_CART_ID_KEY)
            localStorage.removeItem(CART_STORAGE_KEY)
            // Load merged cart from DB
            if (dbCart) {
              setItems(dbCart)
            }
            setMergeProcessed(userSessionKey)
          },
          onError: (error) => {
            console.error('Failed to merge cart:', error)
            // Fallback: just load DB cart
            if (dbCart) {
              setItems(dbCart)
            }
            setMergeProcessed(userSessionKey)
          },
        }
      )
    } else {
      // No anonymous cart, load from DB (even if empty)
      setItems(dbCart || [])
      setMergeProcessed(userSessionKey)
    }
  }, [user, profile?.tenant_id, dbCart, isLoadingDBCart, mergeProcessed])

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      setItems([])
      setMergeProcessed(null)
      localStorage.removeItem(CART_STORAGE_KEY)
      localStorage.removeItem(ANONYMOUS_CART_ID_KEY)
    }
  }, [user])

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
    if (user) return // Don't sync for authenticated users
    
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
  }, [user])

  // Fallback: cross-tab sync via storage events (only for anonymous users)
  useEffect(() => {
    if (user) return // Don't sync for authenticated users
    
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
  }, [user])

  const syncBasket = useCallback((() => {
    let timeout: number | undefined
    let latest: CartItem[] = []
    const send = (items: CartItem[]) => {
      // Only persist to localStorage for anonymous users
      if (!user) {
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
  })(), [user])

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

      syncBasket(newItems)

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
      const newItems = prev.map(item =>
        item.supplierItemId === supplierItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
      syncBasket(newItems)
      return newItems
    })
  }

  const removeItem = (supplierItemId: string) => {
    setItems(prev => {
      const previousItems = prev.map(i => ({ ...i }))
      const removed = prev.find(i => i.supplierItemId === supplierItemId)
      const newItems = prev.filter(item => item.supplierItemId !== supplierItemId)
      syncBasket(newItems)
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
    syncBasket([])
  }

  const restoreItems = (items: CartItem[]) => {
    setItems(items)
    syncBasket(items)
  }

  // Add clearCart method for backward compatibility
  const clearCart = clearBasket

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = (includeVat: boolean): number => {
    return items.reduce((total, item) => {
      const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      return total + ((price ?? 0) * item.quantity)
    }, 0)
  }

  const getMissingPriceCount = () =>
    items.filter(i => i.unitPriceIncVat == null && i.unitPriceExVat == null).length

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
      cartPulseSignal
    }}>
      {children}
    </BasketContext.Provider>
  )
}
