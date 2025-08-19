
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { handleQueryError } from '@/lib/queryErrorHandler'

export function useTenantValidation(targetTenantId?: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['tenant-validation', targetTenantId, profile?.tenant_id],
    queryFn: async () => {
      if (!targetTenantId || !profile?.tenant_id) {
        return { isValid: false, reason: 'Missing tenant context' }
      }

      // Check if user has access to target tenant
      const { data: membership, error } = await supabase
        .from('memberships')
        .select('id, base_role, tenant_id')
        .eq('tenant_id', targetTenantId)
        .eq('user_id', profile.id)
        .single()

      if (error) {
        handleQueryError(error, 'tenant validation')
        return { isValid: false, reason: 'Access denied' }
      }

      // Log potential cross-tenant access attempts
      if (targetTenantId !== profile.tenant_id) {
        console.warn('Cross-tenant access detected:', {
          currentTenant: profile.tenant_id,
          targetTenant: targetTenantId,
          userRole: membership?.base_role,
          timestamp: new Date().toISOString()
        })

        // Check for support session if cross-tenant access
        const { data: supportSession } = await supabase.rpc('has_support_session', {
          target_tenant: targetTenantId
        })

        if (!supportSession) {
          return { 
            isValid: false, 
            reason: 'Cross-tenant access requires support session',
            requiresElevation: true
          }
        }
      }

      return { 
        isValid: true, 
        membership,
        isCrossTenant: targetTenantId !== profile.tenant_id
      }
    },
    enabled: !!targetTenantId && !!profile?.tenant_id,
    staleTime: 1000 * 60 * 2, // 2 minutes - short for security
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}
