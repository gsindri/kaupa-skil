
import { Database } from './types/database'

type Unit = Database['public']['Tables']['units']['Row']
type VatRule = Database['public']['Tables']['vat_rules']['Row']

export interface UnitConversion {
  fromUnit: string
  toUnit: string
  factor: number
}

export interface VatCalculation {
  exVatAmount: number
  incVatAmount: number
  vatAmount: number
  vatRate: number
}

export interface PackPricing {
  packPrice: number
  packQty: number
  packUnit: string
  unitPriceExVat: number
  unitPriceIncVat: number
  yieldPct: number
}

/**
 * Core unit conversion engine for the Iceland B2B system
 */
export class UnitVatEngine {
  private units: Map<string, Unit> = new Map()
  private vatRules: Map<string, VatRule> = new Map()
  
  constructor(units: Unit[], vatRules: VatRule[]) {
    units.forEach(unit => this.units.set(unit.code, unit))
    vatRules.forEach(rule => this.vatRules.set(rule.code, rule))
  }

  /**
   * Convert between units using base unit system
   */
  convertUnits(value: number, fromUnitCode: string, toUnitCode: string): number {
    if (fromUnitCode === toUnitCode) return value

    const fromUnit = this.units.get(fromUnitCode)
    const toUnit = this.units.get(toUnitCode)

    if (!fromUnit || !toUnit) {
      throw new Error(`Unit conversion not supported: ${fromUnitCode} -> ${toUnitCode}`)
    }

    // Check if units share the same base unit
    if (fromUnit.base_unit !== toUnit.base_unit) {
      throw new Error(`Cannot convert between different unit types: ${fromUnitCode} -> ${toUnitCode}`)
    }

    // Convert to base unit, then to target unit
    const fromFactor = fromUnit.conversion_factor || 1
    const toFactor = toUnit.conversion_factor || 1
    
    return (value * fromFactor) / toFactor
  }

  /**
   * Calculate VAT amounts based on code and base amount
   */
  calculateVat(baseAmount: number, vatCode: string, isIncVat: boolean = false): VatCalculation {
    const vatRule = this.vatRules.get(vatCode)
    if (!vatRule) {
      throw new Error(`VAT rule not found: ${vatCode}`)
    }

    const vatRate = vatRule.rate

    let exVatAmount: number
    let incVatAmount: number

    if (isIncVat) {
      // Base amount includes VAT
      incVatAmount = baseAmount
      exVatAmount = baseAmount / (1 + vatRate)
    } else {
      // Base amount excludes VAT
      exVatAmount = baseAmount
      incVatAmount = baseAmount * (1 + vatRate)
    }

    const vatAmount = incVatAmount - exVatAmount

    return {
      exVatAmount,
      incVatAmount,
      vatAmount,
      vatRate
    }
  }

  /**
   * Calculate unit pricing from pack pricing with yield consideration
   */
  calculatePackPricing(
    packPrice: number,
    packQty: number,
    packUnitCode: string,
    targetUnitCode: string,
    vatCode: string,
    yieldPct: number = 100
  ): PackPricing {
    // Convert pack quantity to target unit
    const convertedQty = this.convertUnits(packQty, packUnitCode, targetUnitCode)
    
    // Apply yield factor
    const usableQty = (convertedQty * yieldPct) / 100

    // Calculate VAT
    const vatCalc = this.calculateVat(packPrice, vatCode, false)

    // Calculate unit prices
    const unitPriceExVat = vatCalc.exVatAmount / usableQty
    const unitPriceIncVat = vatCalc.incVatAmount / usableQty

    return {
      packPrice,
      packQty: convertedQty,
      packUnit: targetUnitCode,
      unitPriceExVat,
      unitPriceIncVat,
      yieldPct
    }
  }

  /**
   * Format currency for Iceland (ISK)
   */
  formatCurrency(amount: number, currency: string = 'ISK'): string {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * Get available unit conversions for a base unit
   */
  getConversionsForBaseUnit(baseUnit: string): Unit[] {
    return Array.from(this.units.values()).filter(unit => unit.base_unit === baseUnit)
  }

  /**
   * Get VAT rate for a code
   */
  getVatRate(vatCode: string): number {
    const rule = this.vatRules.get(vatCode)
    return rule?.rate || 0
  }

  /**
   * Get all available VAT rules
   */
  getVatRules(): VatRule[] {
    return Array.from(this.vatRules.values())
  }

  /**
   * Find the smallest comparable unit for price comparison
   */
  findSmallestUnit(unitCode: string): string {
    const unit = this.units.get(unitCode)
    if (!unit?.base_unit) return unitCode

    const conversions = this.getConversionsForBaseUnit(unit.base_unit)
    
    // Find unit with smallest conversion factor (most granular)
    const smallest = conversions.reduce((min, current) => {
      const minFactor = min.conversion_factor || 1
      const currentFactor = current.conversion_factor || 1
      return currentFactor < minFactor ? current : min
    })

    return smallest.code
  }
}

/**
 * Default Iceland VAT configuration
 */
export const ICELAND_VAT_CONFIG = {
  standard: 0.24,  // 24%
  reduced: 0.11,   // 11%
  zero: 0.00       // 0%
}

/**
 * Common unit conversions for Iceland market
 */
export const ICELAND_UNITS = [
  { code: 'kg', name: 'Kilogram', baseUnit: 'kg', conversionFactor: 1.0 },
  { code: 'g', name: 'Gram', baseUnit: 'kg', conversionFactor: 0.001 },
  { code: 'L', name: 'Liter', baseUnit: 'L', conversionFactor: 1.0 },
  { code: 'ml', name: 'Milliliter', baseUnit: 'L', conversionFactor: 0.001 },
  { code: 'each', name: 'Each', baseUnit: 'each', conversionFactor: 1.0 },
]

/**
 * Helper to create engine instance with default Iceland config
 */
export function createIcelandUnitVatEngine(units: Unit[], vatRules: VatRule[]): UnitVatEngine {
  return new UnitVatEngine(units, vatRules)
}
