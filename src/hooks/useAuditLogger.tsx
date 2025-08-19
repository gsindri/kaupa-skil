
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProviderUtils'

interface AuditLogEntry {
  action: string
  entityType?: string
  entityId?: string
  reason?: string
  metadata?: Record<string, any>
}

export function useAuditLogger() {
  const { profile } = useAuth()

  const logAuditEvent = useMutation({
    mutationFn: async ({
      action,
      entityType,
      entityId,
      reason,
      metadata = {}
    }: AuditLogEntry) => {
      // Enhanced metadata with security context
      const enhancedMetadata = {
        ...metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        tenantContext: profile?.tenant_id,
        sessionInfo: {
          referer: document.referrer,
          url: window.location.href
        }
      }

      const { data, error } = await supabase.rpc('log_audit_event', {
        action_name: action,
        entity_type_name: entityType,
        entity_id_val: entityId,
        reason_text: reason,
        meta_data_val: enhancedMetadata,
        tenant_id_val: profile?.tenant_id
      })

      if (error) throw error
      return data
    },
    onError: (error) => {
      console.error('Failed to log audit event:', error)
      // Don't show user-facing error for audit logging failures
    }
  })

  // Helper methods for common audit events
  const logDataAccess = (entityType: string, entityId: string, action = 'data_access') => {
    logAuditEvent.mutate({
      action,
      entityType,
      entityId,
      reason: 'Data access operation'
    })
  }

  const logSecurityEvent = (action: string, reason: string, metadata?: Record<string, any>) => {
    logAuditEvent.mutate({
      action: `security_${action}`,
      entityType: 'security_event',
      reason,
      metadata: {
        ...metadata,
        severity: 'high',
        requiresReview: true
      }
    })
  }

  const logCrossTenantAccess = (targetTenantId: string, reason: string) => {
    logAuditEvent.mutate({
      action: 'cross_tenant_access',
      entityType: 'tenant',
      entityId: targetTenantId,
      reason,
      metadata: {
        sourceTenant: profile?.tenant_id,
        targetTenant: targetTenantId,
        requiresReview: true
      }
    })
  }

  return {
    logAuditEvent,
    logDataAccess,
    logSecurityEvent,
    logCrossTenantAccess
  }
}
