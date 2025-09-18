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
      try {
        // Return empty array since alerts table doesn't exist yet
        return []
      } catch (error) {
        console.warn('Error fetching alerts:', error)
        return []
      }
    },
    enabled: !!profile
  })

  return { alerts: alerts || [], isLoading }
}
