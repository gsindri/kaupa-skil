import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/DeliveryRules', () => ({
  deliveryRules: { getRule: vi.fn() }
}))

import { estimateFee, getDeliveryHint } from '../landedCost'
import { deliveryRules } from '@/services/DeliveryRules'

const mockGetRule = deliveryRules.getRule as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('estimateFee', () => {
  it('returns 0 when no rule exists', async () => {
    mockGetRule.mockResolvedValue(null)
    const fee = await estimateFee('s1', 100)
    expect(fee).toBe(0)
  })

  it('applies flat fee below threshold and 0 above', async () => {
    mockGetRule.mockResolvedValue({
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 200,
      flat_fee: 50,
      fuel_surcharge_pct: 0,
      pallet_deposit_per_unit: 0,
      cutoff_time: '14:00',
      delivery_days: [1, 3],
      tiers_json: [],
      is_active: true,
      id: '1',
      created_at: '',
      updated_at: ''
    })

    const below = await estimateFee('s1', 150)
    const above = await estimateFee('s1', 250)
    expect(below).toBe(50)
    expect(above).toBe(0)
  })
})

describe('getDeliveryHint', () => {
  it('returns null when no rule exists', async () => {
    mockGetRule.mockResolvedValue(null)
    const hint = await getDeliveryHint('s1')
    expect(hint).toBeNull()
  })

  it('returns formatted hint with next delivery day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-01')) // Monday

    mockGetRule.mockResolvedValue({
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 200,
      flat_fee: 50,
      fuel_surcharge_pct: 0,
      pallet_deposit_per_unit: 0,
      cutoff_time: '15:00',
      delivery_days: [2, 4],
      tiers_json: [],
      is_active: true,
      id: '1',
      created_at: '',
      updated_at: ''
    })

    const hint = await getDeliveryHint('s1')
    const expectedDay = new Date('2024-07-02').toLocaleDateString('en-US', { weekday: 'short' })
    expect(hint).toBe(`Order by 15:00 for ${expectedDay}`)
    vi.useRealTimers()
  })
})
