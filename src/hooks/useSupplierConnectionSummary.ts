import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export type SupplierSyncHealth = 'success' | 'warning' | 'danger' | 'unknown'

export interface SupplierConnectionSummary {
  supplierCount: number
  linkedCount: number
  pendingInvites: number
  lastSyncHealth: SupplierSyncHealth
  lastSyncAt?: string | null
}

export function useSupplierConnectionSummary() {
  const { profile } = useAuth()
  const workspaceId = profile?.tenant_id ?? null

  return useQuery<SupplierConnectionSummary>({
    queryKey: [...queryKeys.dashboard.suppliers(), workspaceId],
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!workspaceId) {
        return {
          supplierCount: 0,
          linkedCount: 0,
          pendingInvites: 0,
          lastSyncHealth: 'unknown',
          lastSyncAt: null,
        }
      }

      const [{ data: tenantSuppliers, error: tenantSuppliersError }, { data: connections, error: connectionsError }] =
        await Promise.all([
          supabase
            .from('tenant_suppliers')
            .select('supplier_id')
            .eq('tenant_id', workspaceId),
          supabase
            .from('supplier_connections')
            .select('supplier_id, status, last_sync')
            .eq('tenant_id', workspaceId),
        ])

      if (tenantSuppliersError) {
        console.warn('Failed to load tenant suppliers', tenantSuppliersError)
      }

      if (connectionsError) {
        console.warn('Failed to load supplier connections', connectionsError)
      }

      const supplierCount = tenantSuppliers?.length ?? 0
      const connectionRecords = connections ?? []
      const linkedCount = connectionRecords.filter((record: any) => record?.status === 'connected').length
      const pendingInvites = connectionRecords.filter((record: any) => record?.status === 'needs_login').length

      let lastSyncHealth: SupplierSyncHealth = 'unknown'
      if (connectionRecords.length > 0) {
        if (connectionRecords.some((record: any) => record?.status === 'disconnected')) {
          lastSyncHealth = 'danger'
        } else if (connectionRecords.some((record: any) => record?.status === 'needs_login')) {
          lastSyncHealth = 'warning'
        } else if (connectionRecords.some((record: any) => record?.status === 'connected')) {
          lastSyncHealth = 'success'
        }
      }

      const lastSyncAt = connectionRecords
        .map((record: any) => record?.last_sync)
        .filter(Boolean)
        .sort()
        .reverse()[0]

      return {
        supplierCount,
        linkedCount,
        pendingInvites,
        lastSyncHealth,
        lastSyncAt: lastSyncAt ?? null,
      }
    },
  })
}
