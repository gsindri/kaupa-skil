
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { Capability, PermissionScope, GrantInput, UserMembership } from '@/lib/types/permissions'
import { useToast } from './use-toast'

export function usePermissions(tenantId?: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get user's memberships across all tenants
  const { data: memberships, isLoading: membershipsLoading } = useQuery({
    queryKey: ['user-memberships', user?.id, tenantId],
    queryFn: async (): Promise<UserMembership[]> => {
      const { data, error } = await supabase.rpc('get_user_memberships')
      if (error) throw error
      let result = data || []
      if (tenantId) {
        result = result.filter(m => m.tenant_id === tenantId)
      } else {
        result = result.filter(m => !m.tenant_id)
      }
      return result
    },
    enabled: !!user
  })

  // Check if user has a specific capability
  const hasCapability = async (
    capability: Capability,
    scope: PermissionScope,
    scopeId?: string
  ): Promise<boolean> => {
    if (!user) return false

    const effectiveScope = !tenantId && scope === 'tenant' ? 'personal' : scope

    const { data, error } = await supabase.rpc('has_capability', {
      cap: capability,
      target_scope: effectiveScope,
      target_id: scopeId || null
    })

    if (error) {
      console.error('Error checking capability:', error)
      return false
    }

    return data || false
  }

  // Get grants for a specific membership
  const { data: grants, isLoading: grantsLoading } = useQuery({
    queryKey: ['membership-grants', user?.id, tenantId],
    queryFn: async () => {
      let query = supabase
        .from('grants')
        .select(`
          *,
          membership:memberships(
            id,
            tenant_id,
            base_role,
            tenant:tenants(name)
          )
        `)
        .eq('membership.user_id', user?.id)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // Create new membership
  const createMembership = useMutation({
    mutationFn: async ({
      tenantId,
      userId,
      baseRole
    }: {
      tenantId: string
      userId: string
      baseRole: 'owner' | 'admin' | 'member'
    }) => {
      const { data, error } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          base_role: baseRole
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] })
      toast({
        title: 'Membership created',
        description: 'User has been added to the organization'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating membership',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Add grants to a membership
  const addGrants = useMutation({
    mutationFn: async ({
      membershipId,
      tenantId,
      grants
    }: {
      membershipId: string
      tenantId: string
      grants: GrantInput[]
    }) => {
      const grantInserts = grants.map(grant => ({
        membership_id: membershipId,
        tenant_id: tenantId,
        capability: grant.capability,
        scope: grant.scope,
        scope_id: grant.scope_id,
        constraints: grant.constraints || {}
      }))

      const { data, error } = await supabase
        .from('grants')
        .insert(grantInserts)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-grants'] })
      toast({
        title: 'Permissions updated',
        description: 'User permissions have been updated successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating permissions',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Remove grant
  const removeGrant = useMutation({
    mutationFn: async (grantId: string) => {
      const { error } = await supabase
        .from('grants')
        .delete()
        .eq('id', grantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-grants'] })
      toast({
        title: 'Permission removed',
        description: 'Permission has been removed successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error removing permission',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    memberships,
    membershipsLoading,
    grants,
    grantsLoading,
    hasCapability,
    createMembership,
    addGrants,
    removeGrant
  }
}
