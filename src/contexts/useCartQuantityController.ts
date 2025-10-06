import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CartItem } from '@/lib/types'
import { useCart } from './useBasket'

type AddItemOptions = { showToast?: boolean; animateElement?: HTMLElement }

type RequestQuantityMeta = {
  addItemPayload?: Omit<CartItem, 'quantity'>
  addItemOptions?: AddItemOptions
  onIncrease?: (delta: number) => void
}

const FLYOUT_DURATION_MS = 1200

export function useCartQuantityController(supplierItemId: string, cartQuantity: number) {
  const { addItem, updateQuantity, removeItem } = useCart()

  const requestedRef = useRef(cartQuantity)
  const confirmedRef = useRef(cartQuantity)
  const pendingIncrementRef = useRef(0)
  const [optimisticQuantity, setOptimisticQuantity] = useState(cartQuantity)
  const [pendingIncrement, setPendingIncrement] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [flyoutAmount, setFlyoutAmount] = useState<number | null>(null)
  const flyoutTimerRef = useRef<number>()

  const updatePendingIncrement = useCallback((value: number) => {
    pendingIncrementRef.current = value
    setPendingIncrement(value)
  }, [])

  const updatePendingState = useCallback(() => {
    setIsPending(requestedRef.current !== confirmedRef.current)
  }, [])

  const triggerFlyout = useCallback((amount: number) => {
    if (amount <= 0) return
    setFlyoutAmount(amount)
    if (flyoutTimerRef.current) {
      window.clearTimeout(flyoutTimerRef.current)
    }
    flyoutTimerRef.current = window.setTimeout(() => {
      setFlyoutAmount(null)
      flyoutTimerRef.current = undefined
    }, FLYOUT_DURATION_MS)
  }, [])

  useEffect(() => () => {
    if (flyoutTimerRef.current) {
      window.clearTimeout(flyoutTimerRef.current)
      flyoutTimerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    const previousConfirmed = confirmedRef.current
    const previousRequested = requestedRef.current
    const previousPending = pendingIncrementRef.current
    const confirmedDelta = cartQuantity - previousConfirmed

    confirmedRef.current = cartQuantity

    if (previousPending > 0) {
      let nextPending = previousPending
      if (confirmedDelta > 0) {
        nextPending = Math.max(0, previousPending - confirmedDelta)
      } else if (confirmedDelta < 0) {
        nextPending = 0
      }

      if (nextPending !== pendingIncrementRef.current) {
        updatePendingIncrement(nextPending)
      }
    } else if (previousPending !== 0) {
      updatePendingIncrement(0)
    }

    const pending = pendingIncrementRef.current
    const pendingResolved = previousPending > 0 && pending === 0
    const cartDropped = cartQuantity < previousConfirmed
    const overshotRequested =
      previousPending > 0 && confirmedDelta > previousPending && cartQuantity > previousRequested
    const changedWhileIdle = previousPending === 0 && cartQuantity !== previousRequested
    const quantityChangedExternally = cartDropped || overshotRequested || changedWhileIdle

    if (quantityChangedExternally) {
      if (pendingIncrementRef.current !== 0) {
        updatePendingIncrement(0)
      }
      requestedRef.current = cartQuantity
      setOptimisticQuantity(cartQuantity)
      updatePendingState()
      return
    }

    if (pendingResolved) {
      requestedRef.current = cartQuantity
    }

    setOptimisticQuantity(requestedRef.current)
    updatePendingState()
  }, [cartQuantity, updatePendingIncrement, updatePendingState])

  const requestQuantity = useCallback(
    (rawNext: number, meta: RequestQuantityMeta = {}) => {
      const next = Math.max(0, Number.isFinite(rawNext) ? Math.floor(rawNext) : 0)
      const previousRequested = requestedRef.current

      if (next === previousRequested) {
        return
      }

      const currentConfirmed = confirmedRef.current
      requestedRef.current = next
      setOptimisticQuantity(next)

      const delta = next - previousRequested
      const nextPending = Math.max(0, next - currentConfirmed)
      if (pendingIncrementRef.current !== nextPending) {
        updatePendingIncrement(nextPending)
      }

      if (delta > 0) {
        triggerFlyout(delta)
        meta.onIncrease?.(delta)
      }

      updatePendingState()

      if (next <= 0) {
        removeItem(supplierItemId)
        return
      }

      if (delta > 0 && meta.addItemPayload) {
        addItem(meta.addItemPayload, delta, meta.addItemOptions)
        return
      }

      updateQuantity(supplierItemId, next)
    },
    [addItem, removeItem, supplierItemId, triggerFlyout, updatePendingIncrement, updatePendingState, updateQuantity]
  )

  const remove = useCallback(() => {
    requestedRef.current = 0
    setOptimisticQuantity(0)
    updatePendingIncrement(0)
    updatePendingState()
    removeItem(supplierItemId)
  }, [removeItem, supplierItemId, updatePendingIncrement, updatePendingState])

  const canIncrease = useMemo(() => pendingIncrement <= 0, [pendingIncrement])

  return {
    requestQuantity,
    remove,
    optimisticQuantity,
    isPending,
    pendingIncrement,
    canIncrease,
    flyoutAmount,
  }
}

export type CartQuantityController = ReturnType<typeof useCartQuantityController>
