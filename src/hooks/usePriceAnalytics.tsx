import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

export interface PriceAnalyticsData {
  priceChanges: Array<{ date: string; avgChange: number; totalItems: number }>
  supplierPerformance: Array<{ supplier: string; avgPrice: number; priceStability: number; stockLevel: number }>
  categoryTrends: Array<{ category: string; avgPrice: number; changePercent: number; itemCount: number }>
  savingsOpportunities: Array<{ item: string; currentSupplier: string; bestSupplier: string; potentialSaving: number; confidence: number }>
}

export function usePriceAnalytics() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['price-analytics', profile?.tenant_id],
    queryFn: async (): Promise<PriceAnalyticsData> => {
      const tenantId = profile?.tenant_id

      const { data: priceChanges } = await supabase
        .from('price_change_summary')
        .select('date, avg_change, total_items')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true })

      const { data: supplierPerformance } = await supabase
        .from('supplier_performance_view')
        .select('supplier, avg_price, price_stability, stock_level')
        .eq('tenant_id', tenantId)

      const { data: categoryTrends } = await supabase
        .from('category_price_trends')
        .select('category, avg_price, change_percent, item_count')
        .eq('tenant_id', tenantId)

      const { data: savingsOpportunities } = await supabase
        .from('savings_opportunities')
        .select('item, current_supplier, best_supplier, potential_saving, confidence')
        .eq('tenant_id', tenantId)

      return {
        priceChanges: priceChanges?.map((d: any) => ({
          date: d.date,
          avgChange: d.avg_change,
          totalItems: d.total_items,
        })) || [],
        supplierPerformance: supplierPerformance?.map((d: any) => ({
          supplier: d.supplier,
          avgPrice: d.avg_price,
          priceStability: d.price_stability,
          stockLevel: d.stock_level,
        })) || [],
        categoryTrends: categoryTrends?.map((d: any) => ({
          category: d.category,
          avgPrice: d.avg_price,
          changePercent: d.change_percent,
          itemCount: d.item_count,
        })) || [],
        savingsOpportunities: savingsOpportunities?.map((d: any) => ({
          item: d.item,
          currentSupplier: d.current_supplier,
          bestSupplier: d.best_supplier,
          potentialSaving: d.potential_saving,
          confidence: d.confidence,
        })) || [],
      }
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  })
}

