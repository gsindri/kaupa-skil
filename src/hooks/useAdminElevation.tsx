
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

export function useAdminElevation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Check if user has active elevation
  const { data: hasActiveElevation, isLoading } = useQuery({
    queryKey: ['active-elevation'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_active_elevation')
      if (error) throw error
      return data || false
    },
    refetchInterval: 30000 // Check every 30 seconds
  })

  // Get user's elevations
  const { data: elevations } = useQuery({
    queryKey: ['user-elevations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_elevations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    }
  })

  // Create elevation
  const createElevation = useMutation({
    mutationFn: async ({ reason, duration }: { reason: string; duration?: number }) => {
      const { data, error } = await supabase.rpc('create_elevation', {
        reason_text: reason,
        duration_minutes: duration || 30
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-elevation'] })
      queryClient.invalidateQueries({ queryKey: ['user-elevations'] })
      toast({
        title: 'Elevation activated',
        description: 'You now have elevated privileges for the specified duration'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create elevation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Revoke elevation
  const revokeElevation = useMutation({
    mutationFn: async (elevationId: string) => {
      const { data, error } = await supabase.rpc('revoke_elevation', {
        elevation_id: elevationId
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-elevation'] })
      queryClient.invalidateQueries({ queryKey: ['user-elevations'] })
      toast({
        title: 'Elevation revoked',
        description: 'Your elevated privileges have been revoked'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to revoke elevation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    hasActiveElevation,
    elevations,
    isLoading,
    createElevation,
    revokeElevation
  }
}
