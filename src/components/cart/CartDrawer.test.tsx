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
})
