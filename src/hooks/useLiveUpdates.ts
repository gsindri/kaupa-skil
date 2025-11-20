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
      if (!profile?.tenant_id) return []
      
      const { data, error } = await supabase
        .from('jobs')
        .select('id, type, status, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.warn('Error fetching live updates:', error)
        return []
      }

      return data?.map(job => ({
        id: job.id,
        type: job.type,
        message: `${job.type} - ${job.status}`,
        created_at: job.created_at || new Date().toISOString(),
      })) || []
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 10000,
  })

  return { updates: updates || [], isLoading }
}
