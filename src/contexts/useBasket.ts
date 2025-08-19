import { useContext } from 'react'
import { BasketContext } from './BasketProviderUtils'

export function useBasket() {
  const context = useContext(BasketContext)
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider')
  }
  return context
}

export const useCart = useBasket
