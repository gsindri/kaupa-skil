import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CatalogTable } from './CatalogTable'

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => ({ items: [], addItem: vi.fn(), updateQuantity: vi.fn() }),
}))

vi.mock('@/hooks/useVendors', () => ({
  useVendors: () => ({ vendors: [] }),
}))

vi.mock('@/components/catalog/SupplierChips', () => ({
  default: () => <div />,
}))

vi.mock('@/components/cart/AddToCartButton', () => ({
  default: () => <div />,
}))

describe('PriceCell', () => {
  it('shows lock icon and tooltip when price is locked', async () => {
    const product = {
      catalog_id: '1',
      name: 'Locked Product',
      prices_locked: true,
      price_sources: ['Acme'],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    const hidden = screen.getByText('Price locked')
    const lockIcon = hidden.parentElement?.querySelector('svg') as SVGElement
    expect(lockIcon).toBeInTheDocument()

    const user = userEvent.setup()
    await user.hover(hidden.parentElement as HTMLElement)

    const tooltip = await screen.findAllByText('Connect Acme to see price.')
    expect(tooltip.length).toBeGreaterThan(0)
  })
})
