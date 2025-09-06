import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CatalogTable } from './CatalogTable'

const cartState = { items: [] as any[], addItem: vi.fn(), updateQuantity: vi.fn() }

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => cartState,
}))

vi.mock('@/hooks/useVendors', () => ({
  useVendors: () => ({ vendors: [] }),
}))

vi.mock('@/components/catalog/SupplierChips', () => ({
  default: () => <div />,
}))
describe('CatalogTable', () => {
  beforeEach(() => {
    cartState.items = []
  })
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

  it('displays price even when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 1 }]

    const product = {
      catalog_id: '1',
      name: 'Priced Product',
      prices: [100],
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

    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('shows quantity controls near the product name when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 2 }]

    const product = {
      catalog_id: '1',
      name: 'Stepper Product',
      prices: [100],
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

    expect(
      screen.getByLabelText('Decrease quantity of Stepper Product'),
    ).toBeInTheDocument()
  })

  it('passes full product info to addItem', async () => {
    const product = {
      catalog_id: 'p1',
      name: 'Full Info Product',
      sample_image_url: 'http://example.com/img.jpg',
      canonical_pack: '1kg',
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    const user = userEvent.setup()

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

    await user.click(
      screen.getByRole('button', {
        name: `Add ${product.name} to cart`,
      }),
    )

    const added = cartState.addItem.mock.calls[0][0]
    expect(added).toMatchObject({
      itemName: 'Full Info Product',
      displayName: 'Full Info Product',
      supplierName: 'Acme',
      image: 'http://example.com/img.jpg',
      packSize: '1kg',
    })
  })

  it('disables Add button when product is out of stock', async () => {
    const product = {
      catalog_id: '1',
      name: 'Unavailable Product',
      suppliers: ['Acme'],
      availability_status: 'OUT_OF_STOCK',
    }

    const user = userEvent.setup()

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

    const button = screen.getByRole('button', {
      name: `Add ${product.name} to cart`,
    })
    expect(button).toBeDisabled()
    await user.hover(button.parentElement as HTMLElement)
    const tooltip = await screen.findAllByText('Out of stock')
    expect(tooltip.length).toBeGreaterThan(0)
  })
})

