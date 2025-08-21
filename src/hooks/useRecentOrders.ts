import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

interface RecentOrder {
  id: string
  created_at: string
  supplier_count: number
  total_ex_vat: number
  status: string
}

export function useRecentOrders() {
  const { profile } = useAuth()

  const { data: orders, isLoading } = useQuery<RecentOrder[]>({
    queryKey: [...queryKeys.orders.recent(), profile?.tenant_id],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('id, created_at, status, total_ex_vat, supplier_count')
        .order('created_at', { ascending: false })
        .limit(5)

      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  return { orders: orders || [], isLoading }
}
