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
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Error fetching suppliers:', error)
          return []
        }

        return (
          data?.map((s: any) => ({
            id: s.id,
            supplier_id: s.id,
            name: s.name,
            status: 'not_connected' as SupplierStatus,
            last_sync: null,
            next_run: null,
          })) || []
        )
      } catch (error) {
        console.warn('Error fetching suppliers:', error)
        return []
      }
    },
    enabled: !!profile
  })

  return { suppliers: suppliers || [], isLoading }
}
