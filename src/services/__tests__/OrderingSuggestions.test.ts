import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CartItem } from '@/lib/types'

vi.mock('../DeliveryCalculator', () => ({
  deliveryCalculator: {
    calculateOrderDelivery: vi.fn()
  }
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

import { OrderingSuggestionsService } from '../OrderingSuggestions'
import { deliveryCalculator } from '../DeliveryCalculator'
import { supabase } from '@/integrations/supabase/client'

const calculateOrderDeliveryMock = vi.mocked(deliveryCalculator.calculateOrderDelivery)
const rpcMock = vi.mocked(supabase.rpc)

const baseItem = {
  id: 'item',
  itemName: 'Item',
  sku: 'SKU',
  packSize: '1',
  packPrice: 0,
  unitPriceExVat: 0,
  unitPriceIncVat: 0,
  quantity: 1,
  vatRate: 0,
  unit: 'pcs',
  supplierItemId: 'item',
  displayName: 'Item',
  packQty: 1,
  image: null
}

describe('OrderingSuggestionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('suggests threshold optimization when under free-delivery threshold', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 30000,
        delivery_fee: 5000,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 5000,
        landed_cost: 35000,
        is_under_threshold: true,
        threshold_amount: 50000,
        amount_to_free_delivery: 20000,
        next_delivery_day: null
      }
    ])

    rpcMock.mockResolvedValue({ data: [{ id: 'freq1' }] } as any)

    const cart: CartItem[] = [
      {
        ...baseItem,
        supplierId: 'sup1',
        supplierName: 'Supplier 1',
        unitPriceExVat: 30000,
        unitPriceIncVat: 37200
      }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'threshold_optimization')).toBe(true)
  })

  it('suggests consolidation when multiple small suppliers exist', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 10000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 10000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      },
      {
        supplier_id: 'sup2',
        supplier_name: 'Supplier 2',
        subtotal_ex_vat: 8000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 8000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      }
    ])

    const cart: CartItem[] = [
      { ...baseItem, supplierId: 'sup1', supplierName: 'Supplier 1', unitPriceExVat: 5000, unitPriceIncVat: 6200 },
      { ...baseItem, supplierId: 'sup2', supplierName: 'Supplier 2', unitPriceExVat: 4000, unitPriceIncVat: 4960 }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'consolidation')).toBe(true)
  })

  it('suggests timing optimization when suppliers have different schedules', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 60000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 60000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: 'Mon'
      },
      {
        supplier_id: 'sup2',
        supplier_name: 'Supplier 2',
        subtotal_ex_vat: 70000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 70000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: 'Tue'
      }
    ])

    const cart: CartItem[] = [
      { ...baseItem, supplierId: 'sup1', supplierName: 'Supplier 1', unitPriceExVat: 60000, unitPriceIncVat: 74400 },
      { ...baseItem, supplierId: 'sup2', supplierName: 'Supplier 2', unitPriceExVat: 70000, unitPriceIncVat: 86800 }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'timing_optimization')).toBe(true)
  })
})

