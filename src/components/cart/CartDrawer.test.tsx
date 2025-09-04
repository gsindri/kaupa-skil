import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { BasketContext } from '@/contexts/BasketProviderUtils'
import { SettingsContext } from '@/contexts/SettingsProviderUtils'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('@/components/ui/drawer', () => {
  const MockDrawer = ({ children }: any) => <div>{children}</div>
  return {
    Drawer: ({ children }: any) => <>{children}</>,
    DrawerContent: MockDrawer,
    DrawerHeader: MockDrawer,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
  }
})

import { CartDrawer } from './CartDrawer'

describe('CartDrawer', () => {
  it('closes drawer when Browse Catalog is clicked', async () => {
    const mockSetIsDrawerOpen = vi.fn()
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsContext.Provider
          value={{
            includeVat: false,
            setIncludeVat: vi.fn(),
            preferredUnit: 'auto',
            setPreferredUnit: vi.fn(),
            userMode: 'balanced',
            setUserMode: vi.fn(),
          }}
        >
          <BasketContext.Provider
            value={{
              items: [],
              addItem: vi.fn(),
              updateQuantity: vi.fn(),
              removeItem: vi.fn(),
              clearBasket: vi.fn(),
              clearCart: vi.fn(),
              restoreItems: vi.fn(),
              getTotalItems: () => 0,
              getTotalPrice: () => 0,
              isDrawerOpen: true,
              setIsDrawerOpen: mockSetIsDrawerOpen,
            }}
          >
            <CartDrawer />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    await userEvent.click(screen.getByRole('link', { name: /browse catalog/i }))
    expect(mockSetIsDrawerOpen).toHaveBeenCalledWith(false)
  })

  it('shows displayName when itemName is missing', () => {
    const items = [
      {
        supplierItemId: '1',
        displayName: 'Fallback Name',
        itemName: undefined,
        packSize: '1kg',
        supplierName: 'Supp',
        quantity: 1,
        unitPriceIncVat: 0,
        unitPriceExVat: 0,
        image: '',
      },
    ] as any

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsContext.Provider
          value={{
            includeVat: false,
            setIncludeVat: vi.fn(),
            preferredUnit: 'auto',
            setPreferredUnit: vi.fn(),
            userMode: 'balanced',
            setUserMode: vi.fn(),
          }}
        >
          <BasketContext.Provider
            value={{
              items,
              addItem: vi.fn(),
              updateQuantity: vi.fn(),
              removeItem: vi.fn(),
              clearBasket: vi.fn(),
              clearCart: vi.fn(),
              restoreItems: vi.fn(),
              getTotalItems: () => items.length,
              getTotalPrice: () => 0,
              isDrawerOpen: true,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <CartDrawer />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Fallback Name')).toBeInTheDocument()
    expect(screen.getByTitle('Fallback Name')).toBeInTheDocument()
  })

  it('allows typing quantity directly', async () => {
    const item = {
      supplierItemId: '1',
      itemName: 'Sample',
      packSize: '1kg',
      supplierName: 'Supp',
      quantity: 2,
      unitPriceIncVat: 0,
      unitPriceExVat: 0,
      image: '',
    } as any

    const updateQuantity = vi.fn()

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsContext.Provider
          value={{
            includeVat: false,
            setIncludeVat: vi.fn(),
            preferredUnit: 'auto',
            setPreferredUnit: vi.fn(),
            userMode: 'balanced',
            setUserMode: vi.fn(),
          }}
        >
          <BasketContext.Provider
            value={{
              items: [item],
              addItem: vi.fn(),
              updateQuantity,
              removeItem: vi.fn(),
              clearBasket: vi.fn(),
              clearCart: vi.fn(),
              restoreItems: vi.fn(),
              getTotalItems: () => 1,
              getTotalPrice: () => 0,
              isDrawerOpen: true,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <CartDrawer />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    const qtyDisplay = screen.getByLabelText('Quantity of Sample')
    await userEvent.click(qtyDisplay)
    const input = screen.getByLabelText('Quantity of Sample')
    await userEvent.clear(input)
    await userEvent.type(input, '5{Enter}')

    expect(updateQuantity).toHaveBeenCalledWith('1', 5)
  })
})
