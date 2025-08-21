import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface AlertItem {
  id: string
  supplier: string
  sku: string
  summary: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
}

export function useAlerts() {
  const { profile } = useAuth()

  const { data: alerts, isLoading } = useQuery<AlertItem[]>({
    queryKey: [...queryKeys.dashboard.alerts(), profile?.tenant_id],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('id, supplier, sku, summary, severity, created_at')
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

  return { alerts: alerts || [], isLoading }
}
