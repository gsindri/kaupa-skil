import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CatalogQuantityStepper } from '../CatalogQuantityStepper'
import { BasketContext } from '@/contexts/BasketProviderUtils'
import { useCartQuantityController } from '@/contexts/useCartQuantityController'
import type { CartItem } from '@/lib/types'

describe('CatalogQuantityStepper', () => {
  it('ignores stale confirmations from superseded optimistic updates', () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()

    const { rerender } = render(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })

    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(2)
    expect(handleChange).toHaveBeenCalledWith(3)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('maintains optimistic quantity when stale duplicate arrives after removal', () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()

    const { rerender } = render(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })
    const decrementButton = screen.getByRole('button', {
      name: /remove test product from cart/i,
    })

    fireEvent.click(incrementButton)
    expect(handleChange).toHaveBeenCalledWith(2)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()

    fireEvent.click(decrementButton)
    expect(handleChange).toHaveBeenCalledWith(1)
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('1')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('1')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('syncs to external quantity changes when pending updates do not match', () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()

    const { rerender } = render(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })

    fireEvent.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(2)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={5}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('5')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('applies typed quantity changes on commit', async () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()
    const user = userEvent.setup()

    render(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    const input = screen.getByLabelText(/quantity for test product/i)
    await user.clear(input)
    await user.type(input, '5')
    await user.type(input, '{enter}')

    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it('queues add requests via the cart controller when incremented rapidly', () => {
    const addItem = vi.fn()
    const updateQuantity = vi.fn()
    const removeItem = vi.fn()

    const basketValue: React.ContextType<typeof BasketContext> = {
      items: [],
      addItem,
      updateQuantity,
      removeItem,
      clearBasket: vi.fn(),
      clearCart: vi.fn(),
      restoreItems: vi.fn(),
      getTotalItems: () => 0,
      getTotalPrice: () => 0,
      getMissingPriceCount: () => 0,
      isDrawerOpen: false,
      setIsDrawerOpen: vi.fn(),
      isDrawerPinned: false,
      setIsDrawerPinned: vi.fn() as React.Dispatch<React.SetStateAction<boolean>>,
      cartPulseSignal: 0,
    }

    const payload: Omit<CartItem, 'quantity'> = {
      id: 'item-1',
      supplierId: 'supplier-1',
      supplierName: 'Supplier',
      itemName: 'Test product',
      sku: 'sku-1',
      packSize: '1',
      packPrice: 100,
      unitPriceExVat: 100,
      unitPriceIncVat: 124,
      vatRate: 0.24,
      unit: 'each',
      supplierItemId: 'item-1',
      displayName: 'Test product',
      packQty: 1,
      image: null,
    }

    function ControllerHarness({ quantity }: { quantity: number }) {
      const controller = useCartQuantityController('item-1', quantity)

      return (
        <CatalogQuantityStepper
          quantity={quantity}
          onChange={next =>
            controller.requestQuantity(next, {
              addItemPayload: payload,
            })
          }
          onRemove={controller.remove}
          itemLabel="Test product"
        />
      )
    }

    const { rerender } = render(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={0} />
      </BasketContext.Provider>,
    )

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })

    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)

    expect(addItem).toHaveBeenCalledTimes(3)
    expect(addItem).toHaveBeenNthCalledWith(1, payload, 1, undefined)
    expect(addItem).toHaveBeenNthCalledWith(2, payload, 1, undefined)
    expect(addItem).toHaveBeenNthCalledWith(3, payload, 1, undefined)
    expect(updateQuantity).not.toHaveBeenCalled()

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={3} />
      </BasketContext.Provider>,
    )

    expect(addItem).toHaveBeenCalledTimes(3)
  })
})
