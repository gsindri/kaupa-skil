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
const MAX_PENDING_INCREMENT = 10

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
  const rafRef = useRef<number | null>(null)
  const flyoutTimeoutRef = useRef<number | null>(null)

  const clearFlyout = useCallback(() => {
    if (flyoutTimeoutRef.current != null) {
      window.clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }
    setFlyoutAmount(0)
  }, [])

  const updatePendingIncrement = useCallback((target: number) => {
    const delta = target - committedRef.current

    if (delta === 0) {
      setPendingIncrement(0)
      return
    }

    const boundedDelta = Math.max(
      -MAX_PENDING_INCREMENT,
      Math.min(MAX_PENDING_INCREMENT, delta),
    )
    setPendingIncrement(boundedDelta)
  }, [])

  const flush = useCallback(() => {
    rafRef.current = null
    const next = targetRef.current
    if (next === committedRef.current) return

    const version = ++versionRef.current

    if (next <= 0) {
      removeItem(supplierItemId)
    } else {
      updateQuantity(supplierItemId, next)
    }

    committedRef.current = next
    lastPropSeenRef.current = { version, quantity: next }
    setPendingIncrement(0)
  }, [removeItem, supplierItemId, updateQuantity])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = window.requestAnimationFrame(flush)
  }, [flush])

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

      if (committedRef.current <= 0 && next > 0 && meta?.addItemPayload) {
        const version = ++versionRef.current
        addItem(meta.addItemPayload, next, meta.addItemOptions)
        committedRef.current = next
        lastPropSeenRef.current = { version, quantity: next }
        setPendingIncrement(0)
        return
      }

      scheduleFlush()
    },
    [addItem, clearFlyout, scheduleFlush, updatePendingIncrement]
  )

  const remove = useCallback(() => {
    targetRef.current = 0
    setOptimistic(0)
    updatePendingIncrement(0)
    scheduleFlush()
  }, [scheduleFlush, updatePendingIncrement])

  useEffect(() => {
    const external = Math.max(0, Math.floor(cartQuantity || 0))
    const { version, quantity } = lastPropSeenRef.current

    if (external === quantity) {
      targetRef.current = external
      committedRef.current = external
      lastPropSeenRef.current = { version, quantity: external }
      setOptimistic(external)
      setPendingIncrement(0)
      return
    }

    const hasPendingUpdate = targetRef.current !== committedRef.current

    if (
      !hasPendingUpdate &&
      (external !== targetRef.current || external !== committedRef.current)
    ) {
      targetRef.current = external
      committedRef.current = external
      lastPropSeenRef.current = { version, quantity: external }
      setOptimistic(external)
      setPendingIncrement(0)
    }
  }, [cartQuantity])

  useEffect(() => () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    clearFlyout()
  }, [clearFlyout])

  const canIncrease = pendingIncrement < MAX_PENDING_INCREMENT
  const isPending = targetRef.current !== committedRef.current

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
