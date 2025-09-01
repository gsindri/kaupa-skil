import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import type { Database } from '@/lib/types'

type ConnectorRun = Database['public']['Tables']['connector_runs']['Row'] & {
  supplier?: Database['public']['Tables']['suppliers']['Row']
}
type ConnectorRunInsert = Database['public']['Tables']['connector_runs']['Insert']

export function useConnectorRuns() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: runs, isLoading } = useQuery({
    queryKey: ['connector-runs', profile?.tenant_id || 'solo'],
    queryFn: async (): Promise<ConnectorRun[]> => {
      const tenantId = profile?.tenant_id

      const query = supabase
        .from('connector_runs')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false })

      const { data, error } = tenantId
        ? await query.eq('tenant_id', tenantId)
        : await query.is('tenant_id', null)

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createRun = useMutation({
    mutationFn: async (run: Omit<ConnectorRunInsert, 'id' | 'created_at'>) => {
      const payload = { ...run, tenant_id: profile?.tenant_id ?? null }

      const { data, error } = await supabase
        .from('connector_runs')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-runs'] })
      toast({
        title: 'Ingestion started',
        description: 'Price ingestion has been initiated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start ingestion',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateRun = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConnectorRun> & { id: string }) => {
      const { data, error } = await supabase
        .from('connector_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-runs'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update run',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    runs,
    isLoading,
    createRun,
    updateRun
  }
}
