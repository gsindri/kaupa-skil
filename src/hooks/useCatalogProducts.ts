import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchPublicCatalogItems,
  PublicCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFilters'

export type { PublicCatalogItem }

export function useCatalogProducts(filters: PublicCatalogFilters, sort: SortOrder) {
  const queryClient = useQueryClient()

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
    queryKey: ['catalog', filters, sort],
    queryFn: () => fetchPublicCatalogItems(filters, sort),
  })

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  }
}

