import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCartQuantityController } from '@/contexts/useCartQuantityController'

const addItemMock = vi.fn()
const updateQuantityMock = vi.fn()
const removeItemMock = vi.fn()

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => ({
    addItem: addItemMock,
    updateQuantity: updateQuantityMock,
    removeItem: removeItemMock,
  }),
}))

describe('useCartQuantityController', () => {
  beforeEach(() => {
    addItemMock.mockReset()
    updateQuantityMock.mockReset()
    removeItemMock.mockReset()
  })

  it('reconciles mismatched cart quantities after a pending update resolves', async () => {
    const { result, rerender } = renderHook(
      ({ quantity }) => useCartQuantityController('item-1', quantity),
      {
        initialProps: { quantity: 1 },
      },
    )

    act(() => {
      result.current.requestQuantity(3)
    })

    expect(updateQuantityMock).toHaveBeenCalledWith('item-1', 3)
    expect(result.current.optimisticQuantity).toBe(3)
    expect(result.current.isPending).toBe(true)
    expect(result.current.pendingIncrement).toBe(2)

    act(() => {
      rerender({ quantity: 5 })
    })

    await waitFor(() => {
      expect(result.current.optimisticQuantity).toBe(5)
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.pendingIncrement).toBe(0)
    expect(updateQuantityMock).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.requestQuantity(4)
    })

    expect(updateQuantityMock).toHaveBeenCalledWith('item-1', 4)
    expect(result.current.optimisticQuantity).toBe(4)
  })
})
