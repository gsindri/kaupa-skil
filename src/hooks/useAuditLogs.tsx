import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'

interface AuditLogFilters {
  action?: string
  entityType?: string
  tenantId?: string
  startDate?: string
  endDate?: string
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { user } = useAuth()

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_events')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType)
      }

      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId)
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  return {
    auditLogs,
    isLoading
  }
}
