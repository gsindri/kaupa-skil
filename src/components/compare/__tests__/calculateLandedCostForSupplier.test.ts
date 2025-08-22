import { describe, it, expect, vi } from 'vitest'
import type { DeliveryCalculation } from '@/lib/types/delivery'
import { calculateLandedCostForSupplier } from '../EnhancedComparisonTable'

const loadSpy = vi.fn()
const calculateDeliveryForSupplier = vi.fn<
  [],
  Promise<DeliveryCalculation>
>()

vi.mock('@/services/DeliveryCalculator', () => {
  loadSpy()
  return {
    deliveryCalculator: {
      calculateDeliveryForSupplier,
    },
  }
})

describe('calculateLandedCostForSupplier', () => {
  it('lazy loads calculator and memoizes results', async () => {
    const mockCalculation: DeliveryCalculation = {
      supplier_id: '1',
      supplier_name: 'Test Supplier',
      subtotal_ex_vat: 100,
      delivery_fee: 10,
      fuel_surcharge: 5,
      pallet_deposit: 0,
      total_delivery_cost: 15,
      landed_cost: 115,
      is_under_threshold: false,
      threshold_amount: null,
      amount_to_free_delivery: null,
      next_delivery_day: null,
    }
    calculateDeliveryForSupplier.mockResolvedValue(mockCalculation)

    const cache = new Map<string, DeliveryCalculation>()
    const setCache = (updater: any) => {
      const newCache = typeof updater === 'function' ? updater(cache) : updater
      cache.clear()
      newCache.forEach((v: DeliveryCalculation, k: string) => cache.set(k, v))
    }

    const supplier = {
      id: '1',
      supplierItemId: 'item-1',
      name: 'Test Supplier',
      sku: 'SKU',
      packSize: '1kg',
      packPrice: 100,
      unitPriceExVat: 100,
      unitPriceIncVat: 124,
      unit: 'kg',
    }

    const first = await calculateLandedCostForSupplier(
      supplier,
      1,
      cache,
      setCache,
    )
    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(calculateDeliveryForSupplier).toHaveBeenCalledTimes(1)
    expect(first).toBe(mockCalculation.landed_cost)

    const second = await calculateLandedCostForSupplier(
      supplier,
      1,
      cache,
      setCache,
    )
    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(calculateDeliveryForSupplier).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })
})

