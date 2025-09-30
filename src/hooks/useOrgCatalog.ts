import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { fetchOrgCatalogItems, OrgCatalogFilters } from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFiltersStore'

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

  const baseFilters = useMemo(() => {
    const { cursor: _cursor, ...rest } = filters
    return rest
  }, [filters])

  const query = useInfiniteQuery({
    queryKey: ['orgCatalog', orgId, baseFilters, sort],
    enabled: !!orgId,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchOrgCatalogItems(orgId, { ...filters, cursor: pageParam ?? null }, sort),
    getNextPageParam: lastPage => lastPage.nextCursor,
    staleTime: 30_000,
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

