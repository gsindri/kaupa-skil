import React, { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'
import { getCachedImageUrl } from '@/services/ImageCache'

const CART_STORAGE_KEY = 'procurewise-basket'
const CART_PIN_STORAGE_KEY = 'procurewise-cart-pinned'
export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (!saved) return []

    try {
      const parsed: any[] = JSON.parse(saved)

      // Migration: legacy basket entries only stored the product `name` field.
      // Ensure newer schema fields `itemName` and `displayName` are populated
      // when loading from localStorage for backward compatibility.
      return parsed.map(it => ({
        ...it,
        supplierItemId: it.supplierItemId ?? it.id,
        supplierLogoUrl:
          it.supplierLogoUrl ??
          it.supplier_logo_url ??
          it.logoUrl ??
          it.supplierLogo ??
          null,
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
  })

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

  // Sync basket across tabs
  useEffect(() => {
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
  }, [])

  // Fallback: cross-tab sync via storage events
  useEffect(() => {
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
  }, [])

  const syncBasket = (() => {
    let timeout: number | undefined
    let latest: CartItem[] = []
    const send = (items: CartItem[]) => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('procurewise-basket')
        channel.postMessage({ type: 'BASKET_UPDATED', items })
        channel.close()
      }
    }
    return (items: CartItem[]) => {
      latest = items
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => send(latest), 400)
    }
  })()

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
      normalizedItem = {
        id: item.product_id,
        supplierId: item.supplier_id,
        supplierName: '',
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
