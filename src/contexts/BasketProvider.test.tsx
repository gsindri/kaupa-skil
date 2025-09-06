import React from 'react'
import { renderHook, act } from '@testing-library/react'
import BasketProvider from './BasketProvider'
import { useCart } from './useBasket'

describe('BasketProvider', () => {
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
})
