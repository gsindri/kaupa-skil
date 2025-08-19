
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProviderUtils'
import { useToast } from './use-toast'

export function useSupportSessions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  // Get support sessions for current user
  const { data: supportSessions, isLoading } = useQuery({
    queryKey: ['support-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_sessions')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // Create support session
  const createSupportSession = useMutation({
    mutationFn: async ({
      tenantId,
      reason,
      duration
    }: {
      tenantId: string
      reason: string
      duration?: number
    }) => {
      const { data, error } = await supabase.rpc('create_support_session', {
        target_tenant_id: tenantId,
        reason_text: reason,
        duration_minutes: duration || 60
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-sessions'] })
      toast({
        title: 'Support session created',
        description: 'You can now impersonate this tenant'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create support session',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Revoke support session
  const revokeSupportSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('support_sessions')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id
        })
        .eq('id', sessionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-sessions'] })
      toast({
        title: 'Support session revoked',
        description: 'Impersonation session has been terminated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to revoke session',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    supportSessions,
    isLoading,
    createSupportSession,
    revokeSupportSession
  }
}
