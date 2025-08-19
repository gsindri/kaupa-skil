import { describe, it, expect } from 'vitest'
import { UnitVatEngine } from '../unitVat'
import type { Database } from '../types/database'

type Unit = Database['public']['Tables']['units']['Row']
type VatRule = Database['public']['Tables']['vat_rules']['Row']

const units: Unit[] = [
  { id: '1', code: 'kg', name: 'Kilogram', base_unit: 'kg', conversion_factor: 1, created_at: '' },
  { id: '2', code: 'g', name: 'Gram', base_unit: 'kg', conversion_factor: 0.001, created_at: '' },
  { id: '3', code: 'L', name: 'Liter', base_unit: 'L', conversion_factor: 1, created_at: '' },
  { id: '4', code: 'ml', name: 'Milliliter', base_unit: 'L', conversion_factor: 0.001, created_at: '' },
]

const vatRules: VatRule[] = [
  { id: 'v1', code: 'standard', rate: 0.24, category_id: null, valid_from: '', valid_to: null, created_at: '' },
]

const engine = new UnitVatEngine(units, vatRules)

describe('UnitVatEngine', () => {
  describe('convertUnits', () => {
    it('converts between kilograms and grams', () => {
      expect(engine.convertUnits(1, 'kg', 'g')).toBe(1000)
      expect(engine.convertUnits(500, 'g', 'kg')).toBe(0.5)
    })

    it('converts between liters and milliliters', () => {
      expect(engine.convertUnits(2, 'L', 'ml')).toBe(2000)
      expect(engine.convertUnits(500, 'ml', 'L')).toBe(0.5)
    })

    it('throws for incompatible units', () => {
      expect(() => engine.convertUnits(1, 'kg', 'L')).toThrow(
        'Cannot convert between different unit types: kg -> L',
      )
    })
  })

  describe('calculateVat', () => {
    it('handles exclusive VAT amounts', () => {
      const result = engine.calculateVat(100, 'standard', false)
      expect(result.exVatAmount).toBeCloseTo(100)
      expect(result.incVatAmount).toBeCloseTo(124)
      expect(result.vatAmount).toBeCloseTo(24)
      expect(result.vatRate).toBeCloseTo(0.24)
    })

    it('handles inclusive VAT amounts', () => {
      const result = engine.calculateVat(124, 'standard', true)
      expect(result.exVatAmount).toBeCloseTo(100)
      expect(result.incVatAmount).toBeCloseTo(124)
      expect(result.vatAmount).toBeCloseTo(24)
      expect(result.vatRate).toBeCloseTo(0.24)
    })
  })

  describe('calculatePackPricing', () => {
    it('calculates unit prices with yield factor', () => {
      const result = engine.calculatePackPricing(100, 1, 'kg', 'g', 'standard', 50)

      expect(result.packPrice).toBe(100)
      expect(result.packQty).toBe(1000)
      expect(result.packUnit).toBe('g')
      expect(result.yieldPct).toBe(50)
      expect(result.unitPriceExVat).toBeCloseTo(0.2)
      expect(result.unitPriceIncVat).toBeCloseTo(0.248)
    })
  })
})

