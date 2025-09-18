import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface LiveUpdate {
  id: string
  type: string
  message: string
  created_at: string
}

export function useLiveUpdates() {
  const { profile } = useAuth()

  const { data: updates, isLoading } = useQuery<LiveUpdate[]>({
    queryKey: [...queryKeys.dashboard.liveUpdates(), profile?.tenant_id],
    queryFn: async () => {
      try {
        // Return empty array since connector_runs table doesn't exist yet
        return []
      } catch (error) {
        console.warn('Error fetching live updates:', error)
        return []
      }
    },
    enabled: !!profile,
    refetchInterval: 10000,
  })

  return { updates: updates || [], isLoading }
}
