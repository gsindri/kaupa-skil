import React from 'react'
import { renderHook, act } from '@testing-library/react'
import BasketProvider from './BasketProvider'
import { useCart } from './useBasket'

describe('BasketProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('removes items when quantity is set to zero', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(
        {
          id: '1',
          supplierId: 's1',
          supplierName: 'Supplier',
          itemName: 'Test item',
          sku: 'sku',
          packSize: '1kg',
          packPrice: 100,
          unitPriceExVat: 100,
          unitPriceIncVat: 100,
          quantity: 1,
          vatRate: 0,
          unit: 'each',
          supplierItemId: '1',
          displayName: 'Test item',
          packQty: 1,
          image: null
        },
        1,
        { showToast: false }
      )
    })

    act(() => {
      result.current.updateQuantity('1', 0)
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('migrates legacy cart items and avoids duplicates on add', () => {
    const legacy = [
      {
        id: '1',
        supplierId: 's1',
        supplierName: 'Supplier',
        itemName: 'Legacy item',
        sku: 'sku',
        packSize: '1kg',
        packPrice: null,
        unitPriceExVat: null,
        unitPriceIncVat: null,
        quantity: 1,
        vatRate: 0,
        unit: 'each',
        displayName: 'Legacy item',
        packQty: 1,
        image: null
      }
    ]
    localStorage.setItem('procurewise-basket', JSON.stringify(legacy))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(
        { product_id: '1', supplier_id: 's1' },
        1,
        { showToast: false }
      )
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.items[0].supplierItemId).toBe('1')
  })

  it('auto opens the cart drawer on the first add in a session', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(
        {
          id: 'item-1',
          supplierId: 'supplier',
          supplierName: 'Supplier',
          itemName: 'Item',
          sku: 'sku',
          packSize: '1kg',
          packPrice: 100,
          unitPriceExVat: 100,
          unitPriceIncVat: 120,
          quantity: 1,
          vatRate: 0.24,
          unit: 'each',
          supplierItemId: 'item-1',
          displayName: 'Item',
          packQty: 1,
          image: null
        },
        1,
        { showToast: false }
      )
    })

    expect(result.current.isDrawerOpen).toBe(true)
    expect(sessionStorage.getItem('procurewise-cart-auto-opened')).toBe('1')
  })

  it('emits a pulse signal on subsequent adds when the drawer stays closed', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    const item = {
      id: 'item-1',
      supplierId: 'supplier',
      supplierName: 'Supplier',
      itemName: 'Item',
      sku: 'sku',
      packSize: '1kg',
      packPrice: 100,
      unitPriceExVat: 100,
      unitPriceIncVat: 120,
      quantity: 1,
      vatRate: 0.24,
      unit: 'each',
      supplierItemId: 'item-1',
      displayName: 'Item',
      packQty: 1,
      image: null
    }

    act(() => {
      result.current.addItem(item, 1, { showToast: false })
    })

    act(() => {
      result.current.setIsDrawerOpen(false)
    })

    const initialSignal = result.current.cartPulseSignal

    act(() => {
      result.current.addItem(item, 1, { showToast: false })
    })

    expect(result.current.isDrawerOpen).toBe(false)
    expect(result.current.cartPulseSignal).toBeGreaterThan(initialSignal)
  })

  it('allows pinning the drawer open until manually unpinned', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.isDrawerPinned).toBe(false)

    act(() => {
      result.current.setIsDrawerPinned(true)
    })

    expect(result.current.isDrawerOpen).toBe(true)
    expect(result.current.isDrawerPinned).toBe(true)
    expect(localStorage.getItem('procurewise-cart-pinned')).toBe('1')

    act(() => {
      result.current.setIsDrawerOpen(false)
    })

    expect(result.current.isDrawerPinned).toBe(false)
  })
})
