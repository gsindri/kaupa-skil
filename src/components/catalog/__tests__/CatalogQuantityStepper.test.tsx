import React, { useCallback, useMemo, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CatalogQuantityStepper } from '../CatalogQuantityStepper'
import { BasketContext } from '@/contexts/BasketProviderUtils'
import { useCartQuantityController } from '@/contexts/useCartQuantityController'
import type { CartItem } from '@/lib/types'

describe('CatalogQuantityStepper', () => {
  it('syncs to parent quantity across rapid rerenders', async () => {
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

    await screen.findByDisplayValue('3')
  })

  it('reflects parent quantity updates after removal rerenders', async () => {
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

    expect(screen.getByDisplayValue('1')).toBeInTheDocument()

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

    await screen.findByDisplayValue('2')
  })

  it('syncs to external quantity changes when parent rerenders mid-update', async () => {
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

    await screen.findByDisplayValue('2')
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

  it('does not visually regress when parent prop temporarily decreases', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    function Wrapper() {
      const [quantity, setQuantity] = useState(0)

      return (
        <>
          <CatalogQuantityStepper
            quantity={quantity}
            onChange={value => {
              onChange(value)
            }}
            itemLabel="Test product"
          />
          <button type="button" onClick={() => setQuantity(1)}>
            Parent regress to 1
          </button>
          <button type="button" onClick={() => setQuantity(2)}>
            Parent catch up to 2
          </button>
        </>
      )
    }

    render(<Wrapper />)

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })

    await user.click(incrementButton)
    await user.click(incrementButton)

    expect(onChange).toHaveBeenCalledWith(1)
    expect(onChange).toHaveBeenCalledWith(2)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /parent regress to 1/i }),
    )

    expect(screen.getByDisplayValue('2')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /parent catch up to 2/i }),
    )

    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('updates the cart immediately when incremented rapidly', () => {
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
      cartMode: 'anonymous',
      isHydrating: false,
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
          quantity={controller.targetQuantity}
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

    expect(addItem).toHaveBeenCalledTimes(1)
    expect(addItem).toHaveBeenCalledWith(payload, 1, undefined)
    expect(updateQuantity).toHaveBeenCalledTimes(2)
    expect(updateQuantity).toHaveBeenNthCalledWith(1, 'item-1', 2)
    expect(updateQuantity).toHaveBeenNthCalledWith(2, 'item-1', 3)

    rerender(
      <BasketContext.Provider value={basketValue}>
        <ControllerHarness quantity={3} />
      </BasketContext.Provider>,
    )

    expect(addItem).toHaveBeenCalledTimes(1)
    expect(updateQuantity).toHaveBeenCalledTimes(2)
  })

  it('keeps the increment button enabled during rapid synchronous updates', () => {
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
      cartMode: 'anonymous',
      isHydrating: false,
    }

    function ControllerHarness({ quantity }: { quantity: number }) {
      const controller = useCartQuantityController('item-1', quantity)

      return (
        <CatalogQuantityStepper
          quantity={controller.targetQuantity}
          onChange={next => controller.requestQuantity(next)}
          onRemove={controller.remove}
          itemLabel="Test product"
        />
      )
    }

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

    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(incrementButton).not.toBeDisabled()
    expect(updateQuantity).toHaveBeenCalledTimes(5)
    expect(updateQuantity).toHaveBeenLastCalledWith('item-1', 10)
    expect(addItem).not.toHaveBeenCalled()
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
      cartMode: 'anonymous',
      isHydrating: false,
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
      cartMode: 'anonymous',
      isHydrating: false,
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
          quantity={controller.targetQuantity}
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

  it('maintains the optimistic display across rapid increments while cart updates lag', async () => {
    vi.useFakeTimers()

    const addItem = vi.fn()
    const updateQuantity = vi.fn()
    const removeItem = vi.fn()

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

    try {
      function StepperHarness({ cartQuantity }: { cartQuantity: number }) {
        const controller = useCartQuantityController('item-1', cartQuantity)

        return (
          <CatalogQuantityStepper
            quantity={controller.targetQuantity}
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

      function ProviderHarness() {
        const [cartQuantity, setCartQuantity] = useState(0)

        const scheduleCartQuantity = useCallback((next: number) => {
          window.setTimeout(() => {
            setCartQuantity(next)
          }, 200)
        }, [])

        const basketValue = useMemo<React.ContextType<typeof BasketContext>>(
          () => ({
            items: [],
            addItem: (item, quantity = 0, options) => {
              addItem(item, quantity, options)
              scheduleCartQuantity(quantity)
            },
            updateQuantity: (supplierItemId, quantity) => {
              updateQuantity(supplierItemId, quantity)
              scheduleCartQuantity(quantity)
            },
            removeItem: supplierItemId => {
              removeItem(supplierItemId)
              scheduleCartQuantity(0)
            },
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
            cartMode: 'anonymous',
            isHydrating: false,
          }),
          [scheduleCartQuantity],
        )

        return (
          <BasketContext.Provider value={basketValue}>
            <StepperHarness cartQuantity={cartQuantity} />
          </BasketContext.Provider>
        )
      }

      render(<ProviderHarness />)

      const incrementButton = screen.getByRole('button', {
        name: /increase quantity of test product/i,
      })
      const quantityInput = screen.getByLabelText(/quantity for test product/i)

      fireEvent.click(incrementButton)
      expect(quantityInput).toHaveValue('1')
      expect(addItem).toHaveBeenCalledTimes(1)

      fireEvent.click(incrementButton)
      expect(quantityInput).toHaveValue('2')
      expect(updateQuantity).toHaveBeenCalledWith('item-1', 2)

      fireEvent.click(incrementButton)
      expect(quantityInput).toHaveValue('3')
      expect(updateQuantity).toHaveBeenLastCalledWith('item-1', 3)

      await act(async () => {
        vi.advanceTimersByTime(600)
      })

      expect(quantityInput).toHaveValue('3')
    } finally {
      vi.useRealTimers()
    }
  })
})
