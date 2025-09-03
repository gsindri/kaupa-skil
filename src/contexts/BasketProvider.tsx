
import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('procurewise-basket')
    if (!saved) return []

    try {
      const parsed: any[] = JSON.parse(saved)
      return parsed.map(it => ({
        ...it,
        itemName: it.itemName || it.name,
        displayName: it.displayName || it.name
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
    item: Omit<CartItem, 'quantity'>,
    quantity = 1,
    options: { showToast?: boolean; animateElement?: HTMLElement } = {}
  ) => {
    const previousItems = items.map(i => ({ ...i }))
    if (options.animateElement) {
      flyToCart(options.animateElement)
    }
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.supplierItemId === item.supplierItemId)
      
      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = prev.map((basketItem, index) => 
          index === existingIndex 
            ? { ...basketItem, quantity: basketItem.quantity + quantity }
            : basketItem
        )
      } else {
        newItems = [...prev, { ...item, quantity }]
      }
      
      syncBasket(newItems)

      if (options.showToast !== false) {
        toast({
          description: `Added ${item.itemName} × ${quantity}`,
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
    if (quantity <= 0) {
      removeItem(supplierItemId)
      return
    }

    setItems(prev => {
      const newItems = prev.map(item => 
        item.supplierItemId === supplierItemId ? { ...item, quantity } : item
      )
      syncBasket(newItems)
      return newItems
    })
  }

  const removeItem = (supplierItemId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.supplierItemId !== supplierItemId)
      syncBasket(newItems)
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

  const getTotalPrice = (includeVat: boolean) => {
    return items.reduce((total, item) => {
      const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      return total + (price * item.quantity)
    }, 0)
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
