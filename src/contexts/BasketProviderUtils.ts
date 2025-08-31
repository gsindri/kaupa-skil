import { createContext } from 'react'
import type { CartItem } from '@/lib/types'

export interface BasketContextType {
  items: CartItem[]
  addItem: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
    options?: { showToast?: boolean; animateElement?: HTMLElement }
  ) => void
  updateQuantity: (supplierItemId: string, quantity: number) => void
  removeItem: (supplierItemId: string) => void
  clearBasket: () => void
  clearCart: () => void
  restoreItems: (items: CartItem[]) => void
  getTotalItems: () => number
  getTotalPrice: (includeVat: boolean) => number
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

export const BasketContext = createContext<BasketContextType | undefined>(undefined)
