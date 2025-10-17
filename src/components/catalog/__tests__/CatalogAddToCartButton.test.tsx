import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CatalogAddToCartButton from '../CatalogAddToCartButton'

const requestQuantity = vi.fn()
const remove = vi.fn()

const controllerMock = {
  requestQuantity,
  remove,
  optimisticQuantity: 1,
  targetQuantity: 1,
  isPending: false,
  pendingIncrement: 0,
  canIncrease: true,
  flyoutAmount: 0,
}

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearBasket: vi.fn(),
    clearCart: vi.fn(),
    restoreItems: vi.fn(),
    getTotalItems: vi.fn(),
    getTotalPrice: vi.fn(),
    getMissingPriceCount: vi.fn(),
    isDrawerOpen: false,
    setIsDrawerOpen: vi.fn(),
    isDrawerPinned: false,
    setIsDrawerPinned: vi.fn(),
    cartPulseSignal: 0,
  }),
}))

const useCartQuantityControllerMock = vi.fn((supplierItemId: string, cartQuantity: number) => controllerMock)

vi.mock('@/contexts/useCartQuantityController', async () => {
  const actual = await vi.importActual<
    typeof import('@/contexts/useCartQuantityController')
  >('@/contexts/useCartQuantityController')

  return {
    ...actual,
    useCartQuantityController: (...args: Parameters<typeof actual.useCartQuantityController>) =>
      useCartQuantityControllerMock(...args),
  }
})

vi.mock('@/components/quick/AccessibilityEnhancementsUtils', () => ({
  announceToScreenReader: vi.fn(),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

describe('CatalogAddToCartButton', () => {
  beforeEach(() => {
    requestQuantity.mockClear()
    remove.mockClear()
    controllerMock.optimisticQuantity = 1
    controllerMock.targetQuantity = 1
    controllerMock.canIncrease = true
    useCartQuantityControllerMock.mockClear()
    useCartQuantityControllerMock.mockReturnValue(controllerMock)
  })

  it('applies product-level caps when no supplier is selected', async () => {
    const product = {
      catalog_id: 'prod-1',
      name: 'Test Product',
      max_quantity: 3,
      availability_status: 'IN_STOCK',
    }

    const user = userEvent.setup()

    render(<CatalogAddToCartButton product={product} />)

    expect(await screen.findByText('Max 3')).toBeInTheDocument()

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product from supplier/i,
    })

    await user.click(incrementButton)
    await user.click(incrementButton)

    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
    expect(requestQuantity).toHaveBeenNthCalledWith(1, 2, expect.any(Object))
    expect(requestQuantity).toHaveBeenNthCalledWith(2, 3, expect.any(Object))

    await user.click(incrementButton)
    expect(requestQuantity).toHaveBeenCalledTimes(2)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })
})
