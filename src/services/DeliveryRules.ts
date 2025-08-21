import { supabase } from '@/integrations/supabase/client'
import type { DeliveryRule } from '@/lib/types/delivery'

class DeliveryRulesService {
  private cache = new Map<string, { rule: DeliveryRule | null; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getRule(supplierId: string): Promise<DeliveryRule | null> {
    const now = Date.now()
    const cached = this.cache.get(supplierId)
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.rule
    }

    const { data, error } = await supabase
      .from('delivery_rules')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch delivery rule:', error)
    }

    this.cache.set(supplierId, { rule: data ?? null, timestamp: now })
    return data ?? null
  }
}

export const deliveryRules = new DeliveryRulesService()
