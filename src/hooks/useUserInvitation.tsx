
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { BaseRole } from '@/lib/types/permissions'

interface InviteUserParams {
  email: string
  tenantId: string
  baseRole: BaseRole
  fullName?: string
}

export function useUserInvitation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const inviteUser = useMutation({
    mutationFn: async ({ email, tenantId, baseRole, fullName }: InviteUserParams) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          tenantId,
          baseRole,
          fullName
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || data.message)
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-memberships'] })
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] })
      toast({
        title: 'User invited successfully',
        description: data.message
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to invite user',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return { inviteUser }
}
