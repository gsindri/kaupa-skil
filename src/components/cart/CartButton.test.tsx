import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CartButton } from './CartButton'
import { BasketContext, type BasketContextType } from '@/contexts/BasketProviderUtils'
import { SettingsContext, type SettingsContextType } from '@/contexts/SettingsProviderUtils'
import type { CartItem } from '@/lib/types'

function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    supplierId: 'supplier-1',
    supplierName: 'Supplier One',
    itemName: 'Test Item',
    sku: 'SKU-1',
    packSize: '1',
    packPrice: 100,
    unitPriceExVat: 80,
    unitPriceIncVat: 100,
    quantity: 1,
    vatRate: 0.24,
    unit: 'ea',
    supplierItemId: 'supplier-item-1',
    displayName: 'Test Item',
    packQty: 1,
    image: null,
    ...overrides
  }
}

function renderWithProviders(items: CartItem[]) {
  const basketValue: BasketContextType = {
    items,
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearBasket: vi.fn(),
    clearCart: vi.fn(),
    restoreItems: vi.fn(),
    getTotalItems: vi.fn(() => items.reduce((acc, item) => acc + item.quantity, 0)),
    getTotalPrice: vi.fn(),
    getMissingPriceCount: vi.fn(() => 0),
    isDrawerOpen: false,
    setIsDrawerOpen: vi.fn(),
    isDrawerPinned: false,
    setIsDrawerPinned: vi.fn(),
    cartPulseSignal: 0
  }

  const settingsValue: SettingsContextType = {
    includeVat: true,
    setIncludeVat: vi.fn(),
    preferredUnit: 'ea',
    setPreferredUnit: vi.fn(),
    userMode: 'balanced',
    setUserMode: vi.fn()
  }

  return render(
    <SettingsContext.Provider value={settingsValue}>
      <BasketContext.Provider value={basketValue}>
        <CartButton />
      </BasketContext.Provider>
    </SettingsContext.Provider>
  )
}

describe('CartButton', () => {
  it('renders a transparent trigger with no count when the cart is empty', () => {
    renderWithProviders([])

    const button = screen.getByRole('button', { name: /cart, 0 items/i })
    expect(button).toHaveClass('bg-transparent')
    expect(button).toHaveTextContent(/Cart/i)
    expect(screen.getByText('0', { selector: 'text' })).toBeInTheDocument()
  })

  it('renders the count inside the basket when the cart has items', () => {
    renderWithProviders([createCartItem({ quantity: 3 })])

    const button = screen.getByRole('button', { name: /cart, 3 items/i })
    expect(button).not.toHaveClass('bg-blue-600')
    expect(button.getAttribute('aria-label')).toMatch(/Cart, 3 items/i)
    expect(screen.getByText('3', { selector: 'text' })).toBeInTheDocument()
  })
})
