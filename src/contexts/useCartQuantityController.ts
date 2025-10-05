import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { CartItem } from '@/lib/types'
import { useCart } from './useBasket'

type AddItemOptions = { showToast?: boolean; animateElement?: HTMLElement }

type RequestQuantityMeta = {
  addItemPayload?: Omit<CartItem, 'quantity'>
  addItemOptions?: AddItemOptions
  onIncrease?: (delta: number) => void
}

export function useCartQuantityController(supplierItemId: string, cartQuantity: number) {
  const { addItem, updateQuantity, removeItem } = useCart()

  const requested = useRef(cartQuantity)
  const confirmed = useRef(cartQuantity)
  const pendingDelta = useRef(0)
  const [, forceRender] = useReducer((count: number) => count + 1, 0)

  const setPendingDelta = useCallback(
    (value: number) => {
      if (pendingDelta.current !== value) {
        pendingDelta.current = value
        forceRender()
      }
    },
    [forceRender]
  )

  useEffect(() => {
    confirmed.current = cartQuantity
    if (requested.current === cartQuantity) {
      setPendingDelta(0)
      return
    }
    setPendingDelta(requested.current - cartQuantity)
  }, [cartQuantity, setPendingDelta])

  const requestQuantity = useCallback(
    (next: number, meta: RequestQuantityMeta = {}) => {
      const previousRequested = requested.current

      if (next === previousRequested) {
        return
      }

      if (next <= 0) {
        requested.current = 0
        setPendingDelta(-confirmed.current)
        removeItem(supplierItemId)
        return
      }

      requested.current = next
      const delta = next - previousRequested
      const currentConfirmed = confirmed.current

      if (delta > 0 && meta.onIncrease) {
        meta.onIncrease(delta)
      }

      if (currentConfirmed <= 0) {
        if (delta <= 0) {
          setPendingDelta(requested.current - currentConfirmed)
          return
        }

        if (meta.addItemPayload) {
          addItem(meta.addItemPayload, delta, meta.addItemOptions)
        } else {
          updateQuantity(supplierItemId, next)
        }
        setPendingDelta(requested.current - currentConfirmed)
        return
      }

      updateQuantity(supplierItemId, next)
      setPendingDelta(requested.current - currentConfirmed)
    },
    [addItem, removeItem, supplierItemId, updateQuantity, setPendingDelta]
  )

  const remove = useCallback(() => {
    requested.current = 0
    setPendingDelta(-confirmed.current)
    removeItem(supplierItemId)
  }, [removeItem, supplierItemId, setPendingDelta])

  return {
    requestQuantity,
    remove,
    canIncrease: pendingDelta.current >= 0,
    requested,
    confirmed,
    pendingDelta,
  }
}

export type CartQuantityController = ReturnType<typeof useCartQuantityController>
