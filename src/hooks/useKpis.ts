import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { startOfDay, subDays } from 'date-fns'

export interface DashboardKpis {
  ordersToday: number
  spendToday: number
  suppliersCount: number
  sparklineData: number[]
}

export function useKpis() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  return useQuery<DashboardKpis>({
    queryKey: [...queryKeys.dashboard.kpis(), tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) {
        return {
          ordersToday: 0,
          spendToday: 0,
          suppliersCount: 0,
          sparklineData: []
        }
      }

      const today = startOfDay(new Date())

      // Fetch today's orders
      const { data: ordersToday, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_lines(line_total)')
        .eq('tenant_id', tenantId)
        .gte('order_date', today.toISOString())

      if (ordersError) {
        console.warn('Error fetching orders KPI:', ordersError)
      }

      // Calculate today's spend
      const spendToday = ordersToday?.reduce((total, order) => {
        const orderTotal = order.order_lines?.reduce((sum: number, line: any) => sum + (line.line_total || 0), 0) || 0
        return total + orderTotal
      }, 0) || 0

      // Fetch unique suppliers count (from credentials)
      const { data: suppliers, error: suppliersError } = await supabase
        .from('supplier_credentials')
        .select('supplier_id')
        .eq('tenant_id', tenantId)

      if (suppliersError) {
        console.warn('Error fetching suppliers KPI:', suppliersError)
      }

      const uniqueSuppliers = new Set(suppliers?.map(s => s.supplier_id) || [])

      // Fetch last 7 days spend for sparkline
      const sparklinePromises = Array.from({ length: 7 }, async (_, i) => {
        const dayStart = startOfDay(subDays(new Date(), 6 - i))
        const dayEnd = startOfDay(subDays(new Date(), 5 - i))

        const { data, error } = await supabase
          .from('orders')
          .select('id, order_lines(line_total)')
          .eq('tenant_id', tenantId)
          .gte('order_date', dayStart.toISOString())
          .lt('order_date', dayEnd.toISOString())

        if (error) {
          console.warn(`Error fetching sparkline day ${i}:`, error)
          return 0
        }

        return data?.reduce((total, order) => {
          const orderTotal = order.order_lines?.reduce((sum: number, line: any) => sum + (line.line_total || 0), 0) || 0
          return total + orderTotal
        }, 0) || 0
      })

      const sparklineData = await Promise.all(sparklinePromises)
      const maxSpend = Math.max(...sparklineData, 1)
      const normalizedSparkline = sparklineData.map(spend => spend / maxSpend)

      return {
        ordersToday: ordersToday?.length || 0,
        spendToday,
        suppliersCount: uniqueSuppliers.size,
        sparklineData: normalizedSparkline
      }
    }
  })
}
