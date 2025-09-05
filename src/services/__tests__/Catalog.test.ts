import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '@/integrations/supabase/client'
import { fetchPublicCatalogItems, fetchOrgCatalogItems } from '../catalog'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>

function createQueryMock(eq: ReturnType<typeof vi.fn>) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq,
    gt: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchPublicCatalogItems', () => {
  it('applies on_special filter when provided', async () => {
    const eq = vi.fn().mockReturnThis()
    mockFrom.mockReturnValue(createQueryMock(eq))

    await fetchPublicCatalogItems({ onSpecial: true }, 'az')

    expect(eq).toHaveBeenCalledWith('on_special', true)
  })
})

describe('fetchOrgCatalogItems', () => {
  it('applies on_special filter when provided', async () => {
    const eq = vi.fn().mockReturnThis()
    mockRpc.mockReturnValue(createQueryMock(eq))

    await fetchOrgCatalogItems('org1', { onSpecial: false }, 'az')

    expect(eq).toHaveBeenCalledWith('on_special', false)
  })
})
