import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface PriceAnomaly {
  id: string
  type: string
  item: string
  supplier: string
  description: string
  impact: 'high' | 'medium' | 'low'
  created_at: string
}

export function usePriceAnomalies() {
  const { profile } = useAuth()

  const { data: anomalies, isLoading } = useQuery<PriceAnomaly[]>({
    queryKey: [...queryKeys.dashboard.anomalies(), profile?.tenant_id],
    queryFn: async () => {
      let query = supabase
        .from('price_history')
        .select('id, type, item, supplier, description, impact, created_at')
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

  return { anomalies: anomalies || [], isLoading }
}
