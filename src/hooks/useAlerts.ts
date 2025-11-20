import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface AlertItem {
  id: string
  supplier: string
  sku: string
  summary: string
  severity: 'high' | 'medium' | 'info'
  created_at: string
}

export function useAlerts() {
  const { profile } = useAuth()

  const { data: alerts, isLoading } = useQuery<AlertItem[]>({
    queryKey: [...queryKeys.dashboard.alerts(), profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []
      
      const { data, error } = await supabase
        .from('alerts')
        .select('id, supplier_id, sku, summary, severity, created_at')
        .eq('tenant_id', profile.tenant_id)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('Error fetching alerts:', error)
        return []
      }

      return data?.map(row => ({
        id: row.id,
        supplier: row.supplier_id || '',
        sku: row.sku || '',
        summary: row.summary,
        severity: row.severity as 'high' | 'medium' | 'info',
        created_at: row.created_at,
      })) || []
    },
    enabled: !!profile?.tenant_id
  })

  return { alerts: alerts || [], isLoading }
}
