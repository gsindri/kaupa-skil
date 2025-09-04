import React from 'react'
import { render, screen } from '@testing-library/react'
import { BasketContext } from '@/contexts/BasketProviderUtils'
import { SettingsContext } from '@/contexts/SettingsProviderUtils'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { MiniCart } from './MiniCart'

vi.mock('@/components/ui/popover', () => {
  const Mock = ({ children }: any) => <div>{children}</div>
  return {
    Popover: ({ children }: any) => <>{children}</>,
    PopoverTrigger: Mock,
    PopoverContent: Mock,
  }
})

vi.mock('@/components/ui/tooltip', () => {
  const Mock = ({ children }: any) => <>{children}</>
  return { Tooltip: Mock, TooltipTrigger: Mock, TooltipContent: Mock }
})

describe('MiniCart', () => {
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
      },
    ] as any

    render(
      <MemoryRouter>
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
              isDrawerOpen: false,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <MiniCart />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Fallback Name')).toBeInTheDocument()
    expect(screen.getByTitle('Fallback Name')).toBeInTheDocument()
  })

  it('shows name when itemName and displayName are missing', () => {
    const items = [
      {
        supplierItemId: '2',
        name: 'Only Name',
        packSize: '1kg',
        supplierName: 'Supp',
        quantity: 1,
        unitPriceIncVat: 0,
        unitPriceExVat: 0,
      },
    ] as any

    render(
      <MemoryRouter>
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
              isDrawerOpen: false,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <MiniCart />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Only Name')).toBeInTheDocument()
    expect(screen.getByTitle('Only Name')).toBeInTheDocument()
  })

  it('falls back to title when name fields are missing', () => {
    const items = [
      {
        supplierItemId: '3',
        title: 'Legacy Title',
        packSize: '1kg',
        supplierName: 'Supp',
        quantity: 1,
        unitPriceIncVat: 0,
        unitPriceExVat: 0,
      },
    ] as any

    render(
      <MemoryRouter>
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
              isDrawerOpen: false,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <MiniCart />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Legacy Title')).toBeInTheDocument()
    expect(screen.getByTitle('Legacy Title')).toBeInTheDocument()
  })

  it('falls back to productName when other name fields are missing', () => {
    const items = [
      {
        supplierItemId: '4',
        productName: 'Legacy Product',
        packSize: '1kg',
        supplierName: 'Supp',
        quantity: 1,
        unitPriceIncVat: 0,
        unitPriceExVat: 0,
      },
    ] as any

    render(
      <MemoryRouter>
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
              isDrawerOpen: false,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <MiniCart />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByText('Legacy Product')).toBeInTheDocument()
    expect(screen.getByTitle('Legacy Product')).toBeInTheDocument()
  })

  it('renders item-specific aria labels for controls', () => {
    const items = [
      {
        supplierItemId: '5',
        displayName: 'Aria Item',
        packSize: '1kg',
        supplierName: 'Supp',
        quantity: 2,
        unitPriceIncVat: 0,
        unitPriceExVat: 0,
      },
    ] as any

    render(
      <MemoryRouter>
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
              isDrawerOpen: false,
              setIsDrawerOpen: vi.fn(),
            }}
          >
            <MiniCart />
          </BasketContext.Provider>
        </SettingsContext.Provider>
      </MemoryRouter>
    )

    expect(
      screen.getByLabelText('Increase quantity of Aria Item')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Decrease quantity of Aria Item')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Remove Aria Item from cart')
    ).toBeInTheDocument()
  })
})
