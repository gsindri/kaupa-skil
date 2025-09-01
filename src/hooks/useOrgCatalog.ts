import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { fetchOrgCatalogItems } from '@/services/catalog'
import { useCatalogFilters, shallow } from '@/state/catalogFilters'
import { useDebounce } from './useDebounce'

export function useOrgCatalog(orgId: string, cursor?: string | null) {
  const queryClient = useQueryClient()
  const { filters, onlyWithPrice, sort } = useCatalogFilters(
    s => ({ filters: s.filters, onlyWithPrice: s.onlyWithPrice, sort: s.sort }),
    shallow,
  )
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const appliedFilters = {
    ...filters,
    search: debouncedSearch || undefined,
    onlyWithPrice,
    cursor,
  }

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
    queryKey: ['orgCatalog', orgId, appliedFilters, sort],
    queryFn: () => fetchOrgCatalogItems(orgId, appliedFilters),
    enabled: !!orgId,
  })

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  }
}

