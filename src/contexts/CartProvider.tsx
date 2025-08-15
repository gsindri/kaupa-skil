
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (supplierItemId: string, quantity: number) => void
  removeItem: (supplierItemId: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: (includeVat: boolean) => number
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('procurewise-basket')
    return saved ? JSON.parse(saved) : []
  })
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { toast } = useToast()

  // Sync cart across tabs
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

  const syncCart = (newItems: CartItem[]) => {
    localStorage.setItem('procurewise-basket', JSON.stringify(newItems))
    
    const channel = new BroadcastChannel('procurewise-basket')
    channel.postMessage({ type: 'BASKET_UPDATED', items: newItems })
    channel.close()
  }

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      // Use supplierItemId as the unique identifier for cart items
      const existingIndex = prev.findIndex(i => i.supplierItemId === item.supplierItemId)
      
      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = prev.map((cartItem, index) => 
          index === existingIndex 
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      } else {
        newItems = [...prev, { ...item, quantity }]
      }
      
      syncCart(newItems)
      
      toast({
        title: `Added to basket`,
        description: `${item.itemName} (${quantity}x ${item.packSize})`
      })
      
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
      syncCart(newItems)
      return newItems
    })
  }

  const removeItem = (supplierItemId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.supplierItemId !== supplierItemId)
      syncCart(newItems)
      return newItems
    })
  }

  const clearCart = () => {
    setItems([])
    syncCart([])
    toast({
      title: 'Basket cleared',
      description: 'All items have been removed from your basket'
    })
  }

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
    <CartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isDrawerOpen,
      setIsDrawerOpen
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
