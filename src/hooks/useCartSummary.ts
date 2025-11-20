import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface CartSummary {
  itemCount: number
  totalAmount: number
}

export function useCartSummary() {
  const { profile } = useAuth()

  return useQuery<CartSummary>({
    queryKey: [...queryKeys.dashboard.cart(), profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) {
        return { itemCount: 0, totalAmount: 0 }
      }

      const { data: draftOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_lines(quantity_packs, line_total)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'draft')

      if (error) {
        console.warn('Error fetching cart:', error)
        return { itemCount: 0, totalAmount: 0 }
      }

      const itemCount = draftOrders?.reduce((total, order: any) => {
        return total + (order.order_lines?.length || 0)
      }, 0) || 0

      const totalAmount = draftOrders?.reduce((total, order: any) => {
        const orderTotal = order.order_lines?.reduce(
          (sum: number, line: any) => sum + (line.line_total || 0),
          0
        ) || 0
        return total + orderTotal
      }, 0) || 0

      return { itemCount, totalAmount }
    },
    enabled: !!profile?.tenant_id,
    staleTime: 30_000,
  })
}
