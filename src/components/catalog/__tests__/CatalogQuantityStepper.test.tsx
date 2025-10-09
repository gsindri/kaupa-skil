import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CatalogQuantityStepper } from '../CatalogQuantityStepper'
import { BasketContext } from '@/contexts/BasketProviderUtils'
import { useCartQuantityController } from '@/contexts/useCartQuantityController'
import type { CartItem } from '@/lib/types'

describe('CatalogQuantityStepper', () => {
  it('ignores stale confirmations from superseded optimistic updates', async () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()
    const user = userEvent.setup()

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

    await user.click(incrementButton)
    await user.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(2)
    expect(handleChange).toHaveBeenCalledWith(3)
    await screen.findByDisplayValue('3')

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('3')

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('3')

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('3')
  })

  it('maintains optimistic quantity when stale duplicate arrives after removal', async () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()
    const user = userEvent.setup()

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

    await user.click(incrementButton)
    expect(handleChange).toHaveBeenCalledWith(2)
    await screen.findByDisplayValue('2')

    await user.click(decrementButton)
    expect(handleChange).toHaveBeenCalledWith(1)
    await screen.findByDisplayValue('1')

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('1')

    rerender(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('1')

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByText('1')
  })

  it('syncs to external quantity changes when pending updates do not match', async () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()
    const user = userEvent.setup()

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

    await user.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(2)
    await screen.findByDisplayValue('2')

    rerender(
      <CatalogQuantityStepper
        quantity={5}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('5')

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    await screen.findByDisplayValue('5')
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

  it('queues add requests via the cart controller when incremented rapidly', async () => {
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
          quantity={controller.optimisticQuantity}
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

    await waitFor(() => expect(updateQuantity).toHaveBeenCalledTimes(1))
    expect(addItem).toHaveBeenCalledTimes(1)
    expect(addItem).toHaveBeenCalledWith(payload, 1, undefined)
    expect(updateQuantity).toHaveBeenCalledWith('item-1', 3)

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={3} />
      </BasketContext.Provider>,
    )

    expect(addItem).toHaveBeenCalledTimes(1)
    expect(updateQuantity).toHaveBeenCalledTimes(1)
  })

  it('keeps increasing optimistically while updates are still pending', async () => {
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

    let frameId = 0

    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => {
        frameId += 1
        return frameId
      })

    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})

    function ControllerHarness({ quantity }: { quantity: number }) {
      const controller = useCartQuantityController('item-1', quantity)

      return (
        <CatalogQuantityStepper
          quantity={controller.optimisticQuantity}
          onChange={next => controller.requestQuantity(next)}
          onRemove={controller.remove}
          itemLabel="Test product"
        />
      )
    }

    try {
      render(
        <BasketContext.Provider value={basketValue}>
          <ControllerHarness quantity={5} />
        </BasketContext.Provider>,
      )

      const incrementButton = screen.getByRole('button', {
        name: /increase quantity of test product/i,
      })

      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)

      await waitFor(() => expect(screen.getByDisplayValue('10')).toBeInTheDocument())
      expect(incrementButton).not.toBeDisabled()
      expect(updateQuantity).not.toHaveBeenCalled()
      expect(addItem).not.toHaveBeenCalled()
    } finally {
      rafSpy.mockRestore()
      cancelSpy.mockRestore()
    }
  })

  it('syncs controller quantity when cart items are removed elsewhere', async () => {
    const basketValue: React.ContextType<typeof BasketContext> = {
      items: [],
      addItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
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

    function ControllerProbe({ quantity }: { quantity: number }) {
      const controller = useCartQuantityController('item-1', quantity)
      return <span data-testid="optimistic-quantity">{controller.optimisticQuantity}</span>
    }

    const { rerender } = render(
      <BasketContext.Provider value={basketValue}>
        <ControllerProbe quantity={2} />
      </BasketContext.Provider>,
    )

    await waitFor(() => expect(screen.getByTestId('optimistic-quantity')).toHaveTextContent('2'))

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerProbe quantity={0} />
      </BasketContext.Provider>,
    )

    await waitFor(() => expect(screen.getByTestId('optimistic-quantity')).toHaveTextContent('0'))
  })

  it('never shows a lower quantity while controller increments are pending', async () => {
    const addItem = vi.fn()
    const updateQuantity = vi.fn()

    const basketValue: React.ContextType<typeof BasketContext> = {
      items: [],
      addItem,
      updateQuantity,
      removeItem: vi.fn(),
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
          quantity={controller.optimisticQuantity}
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

    await screen.findByDisplayValue('3')

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={1} />
      </BasketContext.Provider>,
    )

    await screen.findByDisplayValue('3')

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={2} />
      </BasketContext.Provider>,
    )

    await screen.findByDisplayValue('3')

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={3} />
      </BasketContext.Provider>,
    )

    await screen.findByDisplayValue('3')
  })
})
