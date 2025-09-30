import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchPublicCatalogItems,
  PublicCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFiltersStore'
import { stateKeyFragment } from '@/lib/catalogState'

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

  const baseFilters = useMemo(() => {
    const { cursor: _cursor, ...rest } = filters
    return rest
  }, [filters])

  const baseStateHash = useMemo(
    () => stateKeyFragment({ filters: baseFilters, sort } as any),
    [baseFilters, sort],
  )

  const query = useInfiniteQuery({
    queryKey: ['catalog', baseStateHash],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchPublicCatalogItems({ ...filters, cursor: pageParam ?? null }, sort),
    getNextPageParam: lastPage => lastPage.nextCursor,
    staleTime: 30_000,
    gcTime: 900_000,
  })

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    ...restQuery
  } = query

  const pages = queryData?.pages

  const items = useMemo(() => {
    if (!pages) return []
    return pages.flatMap(page => page.items)
  }, [pages])

  const total = useMemo(() => {
    if (!pages?.length) return items.length
    const totalFromPages = pages.reduce(
      (acc, page) => Math.max(acc, page.total ?? 0),
      0,
    )
    return Math.max(totalFromPages, items.length)
  }, [items, pages])
  const nextCursor =
    pages && pages.length ? pages[pages.length - 1]?.nextCursor ?? null : null

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return
    fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return {
    ...restQuery,
    data: items,
    fetchNextPage,
    total,
    nextCursor,
    loadMore,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  }
}

