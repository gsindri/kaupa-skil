import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useProducts } from '../useProducts'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() }
}))

describe('useProducts', () => {
  beforeEach(() => {
    ;(supabase.from as any).mockReset()
  })

  const wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient()
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  it('returns empty array when no products found', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data: [], error: null })
    }
    ;(supabase.from as any).mockReturnValue(queryBuilder)

    const { result } = renderHook(() => useProducts({}), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('returns product data when available', async () => {
    const data = [
      { id: '1', display_name: 'Item', supplier_id: 's1', suppliers: { name: 'Vendor' }, pack_qty: 1, price: 10 }
    ]
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data, error: null })
    }
    ;(supabase.from as any).mockReturnValue(queryBuilder)

    const { result } = renderHook(() => useProducts({}), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { id: '1', name: 'Item', supplierId: 's1', supplierName: 'Vendor', pack: '1', price: 10 }
    ])
  })
})

