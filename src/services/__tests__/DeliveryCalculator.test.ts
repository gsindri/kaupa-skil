import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CartItem } from '@/lib/types'
import type { DeliveryRule } from '@/lib/types/delivery'

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() }
}))

import { DeliveryCalculator } from '../DeliveryCalculator'
import { supabase } from '@/integrations/supabase/client'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

let mockRules: DeliveryRule[] = []

beforeEach(() => {
  mockRules = []
  mockFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: mockRules })
  }))
})

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: '1',
    supplierId: 's1',
    supplierName: 'Supplier 1',
    itemName: 'Item',
    sku: 'SKU',
    packSize: '1',
    packPrice: overrides.unitPriceExVat ?? 0,
    unitPriceExVat: overrides.unitPriceExVat ?? 0,
    unitPriceIncVat: 0,
    quantity: 1,
    vatRate: 0,
    unit: 'each',
    supplierItemId: '1',
    displayName: 'Item',
    packQty: 1,
    ...overrides
  }
}

describe('calculateDeliveryForSupplier', () => {
  it('returns zero fees when no rule exists', async () => {
    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 50 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(0)
    expect(result.fuel_surcharge).toBe(0)
    expect(result.pallet_deposit).toBe(0)
    expect(result.total_delivery_cost).toBe(0)
    expect(result.landed_cost).toBe(50)
    expect(result.is_under_threshold).toBe(false)
    expect(result.threshold_amount).toBeNull()
    expect(result.amount_to_free_delivery).toBeNull()
    expect(result.next_delivery_day).toBeNull()
  })

  it('calculates fees and surcharges below threshold', async () => {
    mockRules = [{
      id: '1',
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 100,
      flat_fee: 10,
      fuel_surcharge_pct: 5,
      pallet_deposit_per_unit: 2,
      cutoff_time: null,
      delivery_days: [2, 4],
      tiers_json: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    }]

    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 40 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(10)
    expect(result.is_under_threshold).toBe(true)
    expect(result.fuel_surcharge).toBeCloseTo(2)
    expect(result.pallet_deposit).toBe(2)
    expect(result.amount_to_free_delivery).toBe(60)
  })

  it('calculates surcharges above threshold with no delivery fee', async () => {
    mockRules = [{
      id: '1',
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 100,
      flat_fee: 10,
      fuel_surcharge_pct: 5,
      pallet_deposit_per_unit: 2,
      cutoff_time: null,
      delivery_days: [2, 4],
      tiers_json: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    }]

    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 60, quantity: 2 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(0)
    expect(result.is_under_threshold).toBe(false)
    expect(result.fuel_surcharge).toBeCloseTo(6)
    expect(result.pallet_deposit).toBe(4)
    expect(result.amount_to_free_delivery).toBeNull()
  })
})

describe('getNextDeliveryDay', () => {
  const calculator = new DeliveryCalculator()

  it('returns next delivery day in same week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-01')) // Monday
    const result = (calculator as any).getNextDeliveryDay([3, 5])
    const expected = new Date('2024-07-03').toLocaleDateString('is-IS', { weekday: 'short', month: 'short', day: 'numeric' })
    expect(result).toBe(expected)
    vi.useRealTimers()
  })

  it('wraps to next week when needed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-05')) // Friday
    const result = (calculator as any).getNextDeliveryDay([2, 3])
    const expected = new Date('2024-07-09').toLocaleDateString('is-IS', { weekday: 'short', month: 'short', day: 'numeric' })
    expect(result).toBe(expected)
    vi.useRealTimers()
  })

  it('returns null when no delivery days are provided', () => {
    const result = (calculator as any).getNextDeliveryDay([])
    expect(result).toBeNull()
  })
})

