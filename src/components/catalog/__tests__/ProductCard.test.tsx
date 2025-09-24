import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicCatalogItem } from '@/services/catalog'
import { ProductCard } from '../ProductCard'

const cartState = {
  items: [] as any[],
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
}

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => cartState,
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

type TestSupplier = {
  supplier_id?: string | null
  supplier_name?: string | null
  id?: string | null
  name?: string | null
  displayName?: string | null
  supplier?: { id?: string | null; name?: string | null } | null
}

type TestProduct = PublicCatalogItem & { suppliers?: TestSupplier[] | null }

const createProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
  catalog_id: 'sku-001',
  name: 'Sample Product',
  brand: null,
  canonical_pack: null,
  pack_sizes: null,
  category_tags: null,
  suppliers_count: 0,
  supplier_ids: [],
  supplier_names: [],
  supplier_logo_urls: [],
  active_supplier_count: 0,
  sample_image_url: null,
  availability_status: 'IN_STOCK',
  availability_text: null,
  availability_updated_at: null,
  sample_source_url: null,
  best_price: null,
  suppliers: [],
  ...overrides,
})

describe('ProductCard supplier label', () => {
  beforeEach(() => {
    cartState.items = []
    vi.clearAllMocks()
  })

  it('shows fallback supplier name when names array is empty', () => {
    const product = createProduct({
      catalog_id: 'sku-fallback',
      name: 'Fallback Granola',
      suppliers_count: 2,
      supplier_ids: ['innnes', 'bonus'],
      supplier_names: ['   ', ''],
      supplier_logo_urls: [null, null],
      suppliers: [
        { supplier_id: 'innnes', supplier_name: 'Innnés' },
        { supplier_id: 'bonus', supplier_name: 'Bonus' },
      ],
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText('Best from Innnés')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('renders supplier label when only fallback entries have names', () => {
    const product = createProduct({
      catalog_id: 'sku-single',
      name: 'Single Supplier',
      suppliers_count: 1,
      supplier_ids: [],
      supplier_names: [],
      supplier_logo_urls: [],
      suppliers: [{ supplier_name: 'Matfugl' }],
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText('Matfugl')).toBeInTheDocument()
  })
})

