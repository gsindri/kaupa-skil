import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CatalogTable } from './CatalogTable'

const cartState = { items: [] as any[], addItem: vi.fn(), updateQuantity: vi.fn() }

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => cartState,
}))

vi.mock('@/hooks/useVendors', () => ({
  useVendors: () => ({ vendors: [] }),
}))

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({ suppliers: [] })
}))

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: () => ({ suppliers: [] })
}))

describe('CatalogTable', () => {
  beforeAll(() => {
    // jsdom does not implement scrollTo; stub to avoid errors from virtualization scrollFn
    window.scrollTo = vi.fn()
  })

  beforeEach(() => {
    cartState.items = []
    cartState.addItem.mockReset()
    cartState.updateQuantity.mockReset()
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
          sort={null}
          onSort={() => {}}
        />
      </TooltipProvider>,
    )

    const priceCallout = await screen.findByText('See price')
    const lockIcon = priceCallout.parentElement?.querySelector('svg') as SVGElement
    expect(lockIcon).toBeInTheDocument()

    const user = userEvent.setup()
    await user.hover(priceCallout.parentElement as HTMLElement)

    const tooltip = await screen.findAllByText('Connect Acme to unlock pricing.')
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
          sort={null}
          onSort={() => {}}
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
          sort={null}
          onSort={() => {}}
        />
      </TooltipProvider>,
    )

    expect(
      screen.getByLabelText(/Quantity for Stepper Product/i),
    ).toBeInTheDocument()
  })

  it('passes full product info to addItem', async () => {
    const user = userEvent.setup()
    const product = {
      catalog_id: 'p1',
      name: 'Full Info Product',
      sample_image_url: 'http://example.com/img.jpg',
      canonical_pack: '1kg',
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          sort={null}
          onSort={() => {}}
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

  it('switches from add button to stepper when item enters the cart', () => {
    const product = {
      catalog_id: '1',
      name: 'Switch Product',
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    const { rerender } = render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          sort={null}
          onSort={() => {}}
        />
      </TooltipProvider>,
    )

    expect(
      screen.getByRole('button', { name: `Add ${product.name} to cart` }),
    ).toBeInTheDocument()

    cartState.items = [
      { supplierItemId: '1', quantity: 3, supplierName: 'Acme' },
    ]

    rerender(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          sort={null}
          onSort={() => {}}
        />
      </TooltipProvider>,
    )

    expect(
      screen.getByLabelText(/Quantity for Switch Product from Acme/i),
    ).toBeInTheDocument()
  })

  it('shows notify action when product is out of stock', async () => {
    const product = {
      catalog_id: '1',
      name: 'Unavailable Product',
      suppliers: ['Acme'],
      availability_status: 'OUT_OF_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          sort={null}
          onSort={() => {}}
        />
      </TooltipProvider>,
    )

    const notifyButton = screen.getByRole('button', { name: 'Notify me' })
    expect(notifyButton).toBeEnabled()
  })
})
