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
      const query = supabase
        .from('connector_runs')
        .select('id, status, created_at, supplier:suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data, error } = profile?.tenant_id
        ? await query.eq('tenant_id', profile.tenant_id)
        : await query.is('tenant_id', null)

      if (error) throw error

      return (
        data?.map((r: any) => ({
          id: r.id,
          type: 'run',
          message: `${r.supplier?.name ?? 'Connector'} ${r.status}`,
          created_at: r.created_at,
        })) || []
      )
    },
    enabled: !!profile,
    refetchInterval: 10000,
  })

  return { updates: updates || [], isLoading }
}
