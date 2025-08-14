
import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'
import type { 
  DeliveryRule, 
  DeliveryCalculation, 
  OrderDeliveryOptimization,
  DeliveryOptimizationSuggestion,
  DeliveryWarning
} from '@/lib/types/delivery'

export class DeliveryCalculator {
  private deliveryRules: Map<string, DeliveryRule> = new Map()
  private lastRulesFetch = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getDeliveryRules(): Promise<Map<string, DeliveryRule>> {
    const now = Date.now()
    
    if (now - this.lastRulesFetch > this.CACHE_DURATION) {
      const { data } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true)

      if (data) {
        this.deliveryRules.clear()
        data.forEach(rule => {
          this.deliveryRules.set(rule.supplier_id, rule)
        })
        this.lastRulesFetch = now
      }
    }

    return this.deliveryRules
  }

  async calculateDeliveryForSupplier(
    supplierId: string,
    supplierName: string,
    items: CartItem[],
    zone = 'default'
  ): Promise<DeliveryCalculation> {
    const rules = await this.getDeliveryRules()
    const rule = rules.get(supplierId)

    const subtotalExVat = items.reduce((sum, item) => 
      sum + (item.unitPriceExVat * item.quantity), 0
    )

    if (!rule) {
      return {
        supplier_id: supplierId,
        supplier_name: supplierName,
        subtotal_ex_vat: subtotalExVat,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: subtotalExVat,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      }
    }

    // Calculate delivery fee
    let deliveryFee = 0
    const isUnderThreshold = rule.free_threshold_ex_vat && subtotalExVat < rule.free_threshold_ex_vat

    if (isUnderThreshold) {
      // Check for tiered pricing
      if (rule.tiers_json && rule.tiers_json.length > 0) {
        const applicableTiers = rule.tiers_json
          .filter(tier => subtotalExVat >= tier.threshold)
          .sort((a, b) => b.threshold - a.threshold)
        
        deliveryFee = applicableTiers.length > 0 ? applicableTiers[0].fee : rule.flat_fee
      } else {
        deliveryFee = rule.flat_fee
      }
    }

    // Calculate surcharges
    const fuelSurcharge = subtotalExVat * (rule.fuel_surcharge_pct / 100)
    const totalPacks = items.reduce((sum, item) => sum + item.quantity, 0)
    const palletDeposit = totalPacks * rule.pallet_deposit_per_unit

    const totalDeliveryCost = deliveryFee + fuelSurcharge + palletDeposit
    const landedCost = subtotalExVat + totalDeliveryCost

    const amountToFreeDelivery = rule.free_threshold_ex_vat && isUnderThreshold
      ? rule.free_threshold_ex_vat - subtotalExVat
      : null

    return {
      supplier_id: supplierId,
      supplier_name: supplierName,
      subtotal_ex_vat: subtotalExVat,
      delivery_fee: deliveryFee,
      fuel_surcharge: fuelSurcharge,
      pallet_deposit: palletDeposit,
      total_delivery_cost: totalDeliveryCost,
      landed_cost: landedCost,
      is_under_threshold: Boolean(isUnderThreshold),
      threshold_amount: rule.free_threshold_ex_vat,
      amount_to_free_delivery: amountToFreeDelivery,
      next_delivery_day: this.getNextDeliveryDay(rule.delivery_days)
    }
  }

  async calculateOrderDelivery(cartItems: CartItem[]): Promise<DeliveryCalculation[]> {
    // Group items by supplier
    const supplierGroups = new Map<string, { name: string; items: CartItem[] }>()
    
    cartItems.forEach(item => {
      if (!supplierGroups.has(item.supplierId)) {
        supplierGroups.set(item.supplierId, {
          name: item.supplierName,
          items: []
        })
      }
      supplierGroups.get(item.supplierId)!.items.push(item)
    })

    const calculations: DeliveryCalculation[] = []
    
    for (const [supplierId, group] of supplierGroups) {
      const calculation = await this.calculateDeliveryForSupplier(
        supplierId,
        group.name,
        group.items
      )
      calculations.push(calculation)
    }

    return calculations
  }

  async optimizeOrder(cartItems: CartItem[]): Promise<OrderDeliveryOptimization> {
    const currentCalculations = await this.calculateOrderDelivery(cartItems)
    const currentTotal = currentCalculations.reduce((sum, calc) => sum + calc.landed_cost, 0)

    const suggestions: DeliveryOptimizationSuggestion[] = []
    const warnings: DeliveryWarning[] = []

    // Generate top-up suggestions
    for (const calc of currentCalculations) {
      if (calc.is_under_threshold && calc.amount_to_free_delivery) {
        suggestions.push({
          type: 'top_up',
          supplier_id: calc.supplier_id,
          supplier_name: calc.supplier_name,
          description: `Add ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()} more to reach free delivery`,
          savings: calc.delivery_fee,
          items: [] // Would be populated with suggested items from pantry/favorites
        })
      }
    }

    // Generate warnings for new suppliers with fees
    for (const calc of currentCalculations) {
      if (calc.total_delivery_cost > 0) {
        warnings.push({
          type: 'new_supplier_fee',
          supplier_id: calc.supplier_id,
          supplier_name: calc.supplier_name,
          message: `Adding items from ${calc.supplier_name} will incur ISK${Math.ceil(calc.total_delivery_cost).toLocaleString()} delivery fee`,
          cost_impact: calc.total_delivery_cost
        })
      }
    }

    return {
      current_total: currentTotal,
      optimized_total: currentTotal, // Would be calculated with optimizations applied
      savings: 0, // Would be calculated
      suggestions,
      warnings
    }
  }

  private getNextDeliveryDay(deliveryDays: number[]): string | null {
    if (!deliveryDays || deliveryDays.length === 0) return null

    const today = new Date()
    const currentDay = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday from 0 to 7

    // Find next available delivery day
    const sortedDays = [...deliveryDays].sort((a, b) => a - b)
    const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]

    const daysUntilDelivery = nextDay > currentDay 
      ? nextDay - currentDay 
      : 7 - currentDay + nextDay

    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + daysUntilDelivery)

    return deliveryDate.toLocaleDateString('is-IS', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export const deliveryCalculator = new DeliveryCalculator()
