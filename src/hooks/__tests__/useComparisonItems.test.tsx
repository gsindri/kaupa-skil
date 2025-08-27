import { renderHook } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() }
}))

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ profile: { tenant_id: 'tenant1' } })
}))

import { supabase } from '@/integrations/supabase/client'
import { useComparisonItems } from '../useComparisonItems'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

function createWrapper() {
  const client = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useComparisonItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches comparison items from supabase', async () => {
    const mockData = [
      {
        id: '1',
        display_name: 'Item 1',
        brand: 'Brand',
        category: { name: 'Cat' },
        pack_size: '1L',
        in_stock: true,
        supplier: { id: 'sup1', name: 'Supplier 1' },
        price_quotes: [{ unit_price_inc_vat: 100 }]
      }
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      is: vi.fn().mockResolvedValue({ data: mockData, error: null })
    })

    const { result } = renderHook(() => useComparisonItems(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(supabase.from).toHaveBeenCalledWith('supplier_items')
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].suppliers[0].unitPriceIncVat).toBe(100)
  })

  it('returns empty list when no data is returned', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      is: vi.fn().mockResolvedValue({ data: [], error: null })
    })

    const { result } = renderHook(() => useComparisonItems(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.items).toHaveLength(0)
  })
})

