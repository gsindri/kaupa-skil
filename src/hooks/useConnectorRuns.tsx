import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from './use-toast'
import { Database } from '@/lib/types/database'

type ConnectorRun = Database['public']['Tables']['connector_runs']['Row'] & {
  supplier?: Database['public']['Tables']['suppliers']['Row']
}
type ConnectorRunInsert = Database['public']['Tables']['connector_runs']['Insert']

export function useConnectorRuns() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: runs, isLoading } = useQuery({
    queryKey: ['connector-runs', profile?.tenant_id],
    queryFn: async (): Promise<ConnectorRun[]> => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('connector_runs')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.tenant_id
  })

  const createRun = useMutation({
    mutationFn: async (run: Omit<ConnectorRunInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('connector_runs')
        .insert(run)
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
