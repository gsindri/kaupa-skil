import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchOrgCatalogItems,
  OrgCatalogFilters,
} from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFilters'

export function useOrgCatalog(
  orgId: string,
  filters: OrgCatalogFilters,
  sort: SortOrder,
) {
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

  const query = useQuery({
    queryKey: ['orgCatalog', orgId, filters, sort],
    queryFn: () => fetchOrgCatalogItems(orgId, filters),
    enabled: !!orgId,
  })

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  }
}

