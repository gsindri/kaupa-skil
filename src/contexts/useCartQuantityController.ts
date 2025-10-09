import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartItem } from '@/lib/types'
import { useCart } from './useBasket'

export type AddItemOptions = {
  showToast?: boolean
  animateElement?: HTMLElement
}

type RequestQuantityMeta = {
  addItemPayload?: Omit<CartItem, 'quantity'>
  addItemOptions?: AddItemOptions
  onIncrease?: (delta: number) => void
}

type Controller = {
  requestQuantity: (next: number, meta?: RequestQuantityMeta) => void
  remove: () => void
  optimisticQuantity: number
  isPending: boolean
  pendingIncrement: number
  canIncrease: boolean
  flyoutAmount: number
}

const FLYOUT_DURATION_MS = 800

export function useCartQuantityController(supplierItemId: string, cartQuantity: number): Controller {
  const { addItem, updateQuantity, removeItem } = useCart()

  const initialQuantity = Math.max(0, Math.floor(cartQuantity || 0))

  const [optimistic, setOptimistic] = useState(initialQuantity)
  const [pendingIncrement, setPendingIncrement] = useState(0)
  const [flyoutAmount, setFlyoutAmount] = useState(0)

  const targetRef = useRef<number>(initialQuantity)
  const committedRef = useRef<number>(initialQuantity)
  const versionRef = useRef(0)
  const lastPropSeenRef = useRef<{ version: number; quantity: number }>({
    version: 0,
    quantity: initialQuantity,
  })
  const flyoutTimeoutRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(initialQuantity)
  const pendingVersionRef = useRef<number | null>(null)
  const hasCartItemRef = useRef(initialQuantity > 0)

  const clearFlyout = useCallback(() => {
    if (flyoutTimeoutRef.current != null) {
      window.clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }
    setFlyoutAmount(0)
  }, [])

  const updatePendingIncrement = useCallback((target: number) => {
    const delta = target - committedRef.current
    setPendingIncrement(delta)
  }, [])

  const commitQuantity = useCallback(
    (next: number) => {
      const version = ++versionRef.current

      pendingVersionRef.current = version
      lastSentRef.current = next

      if (next <= 0) {
        hasCartItemRef.current = false
        removeItem(supplierItemId)
      } else {
        hasCartItemRef.current = true
        updateQuantity(supplierItemId, next)
      }

      lastPropSeenRef.current = { version, quantity: lastPropSeenRef.current.quantity }
    },
    [removeItem, supplierItemId, updateQuantity],
  )

  const requestQuantity = useCallback(
    (rawNext: number, meta?: RequestQuantityMeta) => {
      const next = Math.max(0, Math.floor(rawNext || 0))
      const previousTarget = targetRef.current
      if (next === previousTarget) return

      targetRef.current = next
      setOptimistic(next)
      updatePendingIncrement(next)

      const increaseDelta = Math.max(0, next - previousTarget)
      if (increaseDelta > 0) {
        clearFlyout()
        setFlyoutAmount(increaseDelta)
        flyoutTimeoutRef.current = window.setTimeout(() => {
          setFlyoutAmount(0)
          flyoutTimeoutRef.current = null
        }, FLYOUT_DURATION_MS)
        meta?.onIncrease?.(increaseDelta)
      }

      if (!hasCartItemRef.current && next > 0 && meta?.addItemPayload) {
        const version = ++versionRef.current
        pendingVersionRef.current = version
        hasCartItemRef.current = true
        lastSentRef.current = next
        addItem(meta.addItemPayload, next, meta.addItemOptions)
        lastPropSeenRef.current = { version, quantity: lastPropSeenRef.current.quantity }
        return
      }

      if (next !== lastSentRef.current) {
        commitQuantity(next)
      }
    },
    [addItem, clearFlyout, commitQuantity, updatePendingIncrement],
  )

  const remove = useCallback(() => {
    targetRef.current = 0
    setOptimistic(0)
    updatePendingIncrement(0)
    commitQuantity(0)
  }, [commitQuantity, updatePendingIncrement])

  useEffect(() => {
    const external = Math.max(0, Math.floor(cartQuantity || 0))
    const pendingVersion = pendingVersionRef.current

    if (pendingVersion != null) {
      if (external === targetRef.current) {
        committedRef.current = external
        targetRef.current = external
        pendingVersionRef.current = null
        lastPropSeenRef.current = { version: pendingVersion, quantity: external }
        hasCartItemRef.current = external > 0
        lastSentRef.current = external
        setOptimistic(external)
        setPendingIncrement(0)
      }
      return
    }

    if (external !== committedRef.current) {
      committedRef.current = external
      targetRef.current = external
      lastPropSeenRef.current = { version: versionRef.current, quantity: external }
      hasCartItemRef.current = external > 0
      lastSentRef.current = external
      setOptimistic(external)
      setPendingIncrement(0)
    }
  }, [cartQuantity])

  useEffect(() => () => {
    clearFlyout()
  }, [clearFlyout])

  const canIncrease = true
  const isPending = pendingVersionRef.current != null

  return {
    requestQuantity,
    remove,
    optimisticQuantity: optimistic,
    isPending,
    pendingIncrement,
    canIncrease,
    flyoutAmount,
  }
}

export type CartQuantityController = ReturnType<typeof useCartQuantityController>
