import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { fetchPublicCatalogItems } from '@/services/catalog'
import { useCatalogFilters } from '@/state/catalogFilters'
import { useDebounce } from './useDebounce'

export function useCatalogProducts(cursor?: string | null) {
  const queryClient = useQueryClient()
  const { filters, sort } = useCatalogFilters(state => ({
    filters: state.filters,
    sort: state.sort,
  }))
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const appliedFilters = { ...filters, search: debouncedSearch || undefined, cursor }

  useEffect(() => {
    const channel: any = (supabase as any)?.channel?.('catalog-products')
    if (!channel?.on) return

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )

    channel.subscribe?.()

    return () => {
      channel.unsubscribe?.()
    }
  }, [queryClient])

  const query = useQuery({
    queryKey: ['catalog', appliedFilters, sort],
    queryFn: () => fetchPublicCatalogItems(appliedFilters),
  })

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  }
}

