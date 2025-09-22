import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface DeliveryRule {
  id: string
  supplier_id: string
  delivery_days: number[] | null
  cutoff_time: string | null
  flat_fee: number | null
  free_threshold_ex_vat: number | null
}

export function useUpcomingDeliveries() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery<DeliveryRule[]>({
    queryKey: [...queryKeys.dashboard.deliveries(), profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_rules')
        .select('id, supplier_id, delivery_days, cutoff_time, flat_fee, free_threshold_ex_vat')
        .eq('is_active', true)

      if (error) {
        console.warn('Error fetching upcoming deliveries:', error)
        return []
      }

      return data ?? []
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  })

  return { rules: data ?? [], isLoading }
}
