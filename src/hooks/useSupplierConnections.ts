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
  logo_url?: string | null
}

export function useSupplierConnections() {
  const { profile } = useAuth()

  const { data: suppliers, isLoading } = useQuery<SupplierConnection[]>({
    queryKey: [...queryKeys.dashboard.suppliers(), profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      try {
        const { data, error } = await supabase
          .from('supplier_credentials')
          .select(`
            supplier_id,
            suppliers!inner(id, name, logo_url)
          `)
          .eq('tenant_id', profile.tenant_id)

        if (error) {
          console.warn('Error fetching supplier credentials:', error)
          return []
        }

        const credentialSupplierIds = data?.map(d => d.supplier_id) || []

        const { data: connections } = await supabase
          .from('supplier_connections')
          .select('supplier_id, status, last_sync, next_scheduled_sync')
          .eq('tenant_id', profile.tenant_id)
          .in('supplier_id', credentialSupplierIds)

        const connectionMap = new Map(
          connections?.map(c => [c.supplier_id, c]) || []
        )

        return (
          data?.map((cred: any) => {
            const connection = connectionMap.get(cred.supplier_id)
            return {
              id: cred.supplier_id,
              supplier_id: cred.supplier_id,
              name: cred.suppliers.name,
              status: (connection?.status || 'not_connected') as SupplierStatus,
              last_sync: connection?.last_sync || null,
              next_run: connection?.next_scheduled_sync || null,
              logo_url: cred.suppliers.logo_url,
            }
          }) || []
        )
      } catch (error) {
        console.warn('Error fetching supplier connections:', error)
        return []
      }
    },
    enabled: !!profile
  })

  return { suppliers: suppliers || [], isLoading }
}
