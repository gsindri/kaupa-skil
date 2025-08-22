
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

export function useDeliveryAnalytics(months: number = 6) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['delivery-analytics', profile?.tenant_id || 'solo', months],
    queryFn: async () => {
      const tenantId = profile?.tenant_id

      // Get monthly delivery spending
      const baseMonthly = supabase
        .from('delivery_analytics')
        .select('*')
        .gte('month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('month', { ascending: true })

      const { data: monthlyData } = tenantId
        ? await baseMonthly.eq('tenant_id', tenantId)
        : await baseMonthly.is('tenant_id', null)

      // Get supplier breakdown - fixed the query structure
      const baseSupplier = supabase
        .from('delivery_analytics')
        .select(`
          supplier_id,
          suppliers(name),
          total_fees_paid,
          total_orders,
          orders_under_threshold
        `)
        .gte('month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: supplierData } = tenantId
        ? await baseSupplier.eq('tenant_id', tenantId)
        : await baseSupplier.is('tenant_id', null)

      // Process the data
      const monthlySpend = monthlyData?.reduce((acc, item) => {
        const month = new Date(item.month).toLocaleDateString('is-IS', { month: 'short', year: 'numeric' })
        const existing = acc.find((a: { month: string; fees: number; orders: number }) => a.month === month)
        
        if (existing) {
          existing.fees += item.total_fees_paid
          existing.orders += item.total_orders
        } else {
          acc.push({
            month,
            fees: item.total_fees_paid,
            orders: item.total_orders
          })
        }
        
        return acc
      }, [] as Array<{ month: string; fees: number; orders: number }>) || []

      // Fixed supplier breakdown processing to handle the correct data structure
      const supplierBreakdown = supplierData?.reduce((acc, item) => {
        const supplierName = (item.suppliers as any)?.name || 'Unknown Supplier'
        const existing = acc.find((a: { supplier: string; fees: number; orders: number; efficiency: number }) => a.supplier === supplierName)
        const efficiency = item.total_orders > 0 
          ? Math.round(((item.total_orders - item.orders_under_threshold) / item.total_orders) * 100)
          : 0
        
        if (existing) {
          existing.fees += item.total_fees_paid
          existing.orders += item.total_orders
          existing.efficiency = Math.round((existing.efficiency + efficiency) / 2)
        } else {
          acc.push({
            supplier: supplierName,
            fees: item.total_fees_paid,
            orders: item.total_orders,
            efficiency
          })
        }
        
        return acc
      }, [] as Array<{ supplier: string; fees: number; orders: number; efficiency: number }>) || []

      // Calculate threshold analysis
      const totalOrders = monthlyData?.reduce((sum, item) => sum + item.total_orders, 0) || 0
      const ordersWithFees = monthlyData?.reduce((sum, item) => sum + item.orders_under_threshold, 0) || 0
      const totalFeesPaid = monthlyData?.reduce((sum, item) => sum + item.total_fees_paid, 0) || 0
      const potentialSavings = Math.round(totalFeesPaid * 0.3) // Estimate 30% could be saved with optimization

      return {
        monthlySpend,
        supplierBreakdown,
        thresholdAnalysis: {
          totalOrders,
          ordersWithFees,
          totalFeesPaid,
          potentialSavings
        },
        trends: {
          feeReduction: 0, // Would calculate from historical data
          orderEfficiency: totalOrders > 0 ? Math.round(((totalOrders - ordersWithFees) / totalOrders) * 100) : 0,
          avgOrderValue: 0 // Would calculate from order data
        }
      }
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
