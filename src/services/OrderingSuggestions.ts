
import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'
import type { DeliveryCalculation } from '@/lib/types/delivery'
import { deliveryCalculator } from './DeliveryCalculator'

export interface OrderingSuggestion {
  id: string
  type: 'threshold_optimization' | 'consolidation' | 'timing_optimization'
  title: string
  description: string
  potential_savings: number
  confidence: number
  actions: SuggestionAction[]
  metadata: Record<string, any>
}

export interface SuggestionAction {
  type: 'add_item' | 'increase_quantity' | 'delay_order' | 'merge_suppliers'
  item_id?: string
  supplier_id?: string
  quantity_change?: number
  description: string
}

export class OrderingSuggestionsService {
  async generateSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Get current delivery calculations
    const deliveryCalculations = await deliveryCalculator.calculateOrderDelivery(cartItems)
    
    // Generate threshold optimization suggestions
    const thresholdSuggestions = await this.generateThresholdSuggestions(deliveryCalculations, cartItems)
    suggestions.push(...thresholdSuggestions)
    
    // Generate consolidation suggestions
    const consolidationSuggestions = await this.generateConsolidationSuggestions(cartItems)
    suggestions.push(...consolidationSuggestions)
    
    // Generate timing optimization suggestions
    const timingSuggestions = await this.generateTimingSuggestions(deliveryCalculations)
    suggestions.push(...timingSuggestions)
    
    return suggestions.sort((a, b) => b.potential_savings - a.potential_savings)
  }

  private async generateThresholdSuggestions(
    calculations: DeliveryCalculation[], 
    cartItems: CartItem[]
  ): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    for (const calc of calculations) {
      if (calc.is_under_threshold && calc.amount_to_free_delivery) {
        // Get frequently ordered items from this supplier
        const frequentItems = await this.getFrequentlyOrderedItems(calc.supplier_id)
        
        if (frequentItems.length > 0) {
          suggestions.push({
            id: `threshold_${calc.supplier_id}`,
            type: 'threshold_optimization',
            title: `Reach free delivery from ${calc.supplier_name}`,
            description: `Add ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()} more to save ISK${Math.ceil(calc.delivery_fee).toLocaleString()} in delivery fees`,
            potential_savings: calc.delivery_fee,
            confidence: 0.85,
            actions: [{
              type: 'add_item',
              supplier_id: calc.supplier_id,
              description: `Add items worth ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()}`
            }],
            metadata: {
              supplier_id: calc.supplier_id,
              threshold_amount: calc.threshold_amount,
              current_amount: calc.subtotal_ex_vat,
              suggested_items: frequentItems.slice(0, 3)
            }
          })
        }
      }
    }
    
    return suggestions
  }

  private async generateConsolidationSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Group by supplier and find opportunities to consolidate
    const supplierGroups = cartItems.reduce((groups, item) => {
      if (!groups[item.supplierId]) {
        groups[item.supplierId] = []
      }
      groups[item.supplierId].push(item)
      return groups
    }, {} as Record<string, CartItem[]>)
    
    // If we have multiple suppliers with small orders, suggest consolidation
    const smallOrders = Object.entries(supplierGroups).filter(([_, items]) => {
      const total = items.reduce((sum, item) => sum + (item.unitPriceExVat * item.quantity), 0)
      return total < 50000 // Less than ISK 50,000
    })
    
    if (smallOrders.length >= 2) {
      const totalSavings = smallOrders.length * 2000 // Estimate ISK 2,000 per supplier delivery fee
      
      suggestions.push({
        id: 'consolidate_suppliers',
        type: 'consolidation',
        title: 'Consolidate suppliers to reduce delivery fees',
        description: `Consider sourcing from fewer suppliers to reduce delivery costs`,
        potential_savings: totalSavings,
        confidence: 0.7,
        actions: [{
          type: 'merge_suppliers',
          description: `Review if items from ${smallOrders.length} suppliers can be sourced elsewhere`
        }],
        metadata: {
          small_order_suppliers: smallOrders.map(([supplierId]) => supplierId),
          estimated_fees: totalSavings
        }
      })
    }
    
    return suggestions
  }

  private async generateTimingSuggestions(calculations: DeliveryCalculation[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Check for suppliers with different delivery schedules
    const deliverySchedules = calculations
      .filter(calc => calc.next_delivery_day)
      .map(calc => ({
        supplier: calc.supplier_name,
        next_delivery: calc.next_delivery_day,
        supplier_id: calc.supplier_id
      }))
    
    if (deliverySchedules.length > 1) {
      const uniqueDates = [...new Set(deliverySchedules.map(s => s.next_delivery))]
      
      if (uniqueDates.length > 1) {
        suggestions.push({
          id: 'timing_optimization',
          type: 'timing_optimization',
          title: 'Optimize delivery timing',
          description: `Some suppliers have different delivery schedules. Consider timing orders for maximum efficiency.`,
          potential_savings: 0, // More about convenience than cost
          confidence: 0.6,
          actions: [{
            type: 'delay_order',
            description: 'Align order timing with delivery schedules'
          }],
          metadata: {
            delivery_schedules: deliverySchedules
          }
        })
      }
    }
    
    return suggestions
  }

  private async getFrequentlyOrderedItems(supplierId: string): Promise<any[]> {
    try {
      // Fixed: Removed .group() and used proper aggregation in the select
      const { data } = await supabase
        .rpc('get_frequent_items_by_supplier', {
          supplier_id_param: supplierId,
          days_back: 90
        })

      return data || []
    } catch (error) {
      console.error('Failed to fetch frequently ordered items:', error)
      // Fallback to a simpler query without grouping
      try {
        const { data } = await supabase
          .from('order_lines')
          .select(`
            supplier_item_id,
            supplier_items(name, pack_size, unit_price_ex_vat, unit_price_inc_vat)
          `)
          .eq('supplier_id', supplierId)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .limit(5)

        return data || []
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }
    }
  }
}

export const orderingSuggestions = new OrderingSuggestionsService()
