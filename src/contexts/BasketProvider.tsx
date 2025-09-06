import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'
import { getCachedImageUrl } from '@/services/ImageCache'

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('procurewise-basket')
    if (!saved) return []

    try {
      const parsed: any[] = JSON.parse(saved)

      // Migration: legacy basket entries only stored the product `name` field.
      // Ensure newer schema fields `itemName` and `displayName` are populated
      // when loading from localStorage for backward compatibility.
      return parsed.map(it => ({
        ...it,
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { toast } = useToast()

  // Sync basket across tabs
  useEffect(() => {
    const channel = new BroadcastChannel('procurewise-basket')

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BASKET_UPDATED') {
        setItems(event.data.items)
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => channel.close()
  }, [])

  const syncBasket = (newItems: CartItem[]) => {
    localStorage.setItem('procurewise-basket', JSON.stringify(newItems))

    const channel = new BroadcastChannel('procurewise-basket')
    channel.postMessage({ type: 'BASKET_UPDATED', items: newItems })
    channel.close()
  }

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

  const getTotalPrice = (includeVat: boolean): number | null => {
    let total = 0
    for (const item of items) {
      const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      if (price == null) return null
      total += price * item.quantity
    }
    return total
  }

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
      isDrawerOpen,
      setIsDrawerOpen
    }}>
      {children}
    </BasketContext.Provider>
  )
}

