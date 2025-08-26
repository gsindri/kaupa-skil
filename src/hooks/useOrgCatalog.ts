import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchOrgCatalogItems,
  type FacetFilters,
} from '@/services/catalog'

type Filters = FacetFilters & { onlyWithPrice?: boolean }

export function useOrgCatalog(orgId: string, filters: Filters) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orgId) return
    const channel: any = (supabase as any)?.channel?.(`org-catalog-${orgId}`)
    if (!channel?.on) return

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_product' },
        () => queryClient.invalidateQueries({ queryKey: ['orgCatalog'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_product' },
        () => queryClient.invalidateQueries({ queryKey: ['orgCatalog'] }),
      )

    channel.subscribe?.()

    return () => {
      channel.unsubscribe?.()
    }
  }, [queryClient, orgId])

  return useQuery({
    queryKey: ['orgCatalog', orgId, filters],
    queryFn: () => fetchOrgCatalogItems(orgId, filters),
    enabled: !!orgId,
  })
}
