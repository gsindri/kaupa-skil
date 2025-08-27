import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { SupplierStatus } from '@/components/dashboard/status-tokens'

export interface SupplierConnection {
  id: string
  supplier_id: string
  name: string
  status: SupplierStatus
  last_sync: string | null
  next_run: string | null
}

export function useSupplierConnections() {
  const { profile } = useAuth()

  const { data: suppliers, isLoading } = useQuery<SupplierConnection[]>({
    queryKey: [...queryKeys.dashboard.suppliers(), profile?.tenant_id],
    queryFn: async () => {
      const query = supabase
        .from('supplier_connections')
        .select('id, supplier_id, status, last_sync, next_run, supplier:suppliers(name)')
        .order('created_at', { ascending: false })

      const { data, error } = profile?.tenant_id
        ? await query.eq('tenant_id', profile.tenant_id)
        : await query.is('tenant_id', null)

      if (error) throw error

      return (
        data?.map((s: any) => ({
          id: s.id,
          supplier_id: s.supplier_id,
          name: s.supplier?.name ?? '',
          status: s.status as SupplierStatus,
          last_sync: s.last_sync,
          next_run: s.next_run,
        })) || []
      )
    },
    enabled: !!profile
  })

  return { suppliers: suppliers || [], isLoading }
}
