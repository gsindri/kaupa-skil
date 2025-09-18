import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchOrgCatalogItems,
  OrgCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFiltersStore'

export function useOrgCatalog(
  orgId: string,
  filters: OrgCatalogFilters,
  sort: SortOrder,
) {
  const queryClient = useQueryClient()
  const [allItems, setAllItems] = useState<PublicCatalogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

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

  // Create a stable key for the base query (without cursor)
  const { cursor, ...baseFilters } = filters;
  const baseKey = JSON.stringify({ orgId, filters: baseFilters, sort });

  // Reset accumulated data when base filters change
  useEffect(() => {
    setAllItems([]);
    setNextCursor(null);
    setTotal(0);
  }, [baseKey]);

  const query = useQuery({
    queryKey: ['orgCatalog', orgId, baseFilters, sort, cursor || 'initial'],
    queryFn: () => fetchOrgCatalogItems(orgId, filters, sort),
    enabled: !!orgId,
  })

  // Accumulate results when new data arrives
  useEffect(() => {
    if (query.data) {
      const { items, nextCursor: newNextCursor, total: newTotal } = query.data;
      
      if (cursor) {
        // This is a "load more" request - append new items
        setAllItems(prev => {
          const merged = [...prev, ...items];
          // Deduplicate by catalog_id
          const seen = new Set<string>();
          return merged.filter(item => {
            if (seen.has(item.catalog_id)) return false;
            seen.add(item.catalog_id);
            return true;
          });
        });
      } else {
        // This is an initial load - replace all items
        setAllItems(items || []);
      }
      
      setNextCursor(newNextCursor);
      setTotal(newTotal || 0);
    }
  }, [query.data, cursor]);

  const loadMore = useCallback(() => {
    if (nextCursor && !query.isFetching) {
      console.log('useOrgCatalog: Loading more with cursor:', nextCursor)
      // Update the filters to include the cursor, which will trigger a new query
      queryClient.invalidateQueries({ 
        queryKey: ['orgCatalog', orgId, { ...baseFilters, cursor: nextCursor }, sort, nextCursor] 
      })
    }
  }, [nextCursor, query.isFetching, queryClient, orgId, baseFilters, sort]);

  return {
    ...query,
    data: allItems,
    nextCursor,
    total,
    loadMore,
    hasNextPage: !!nextCursor,
    isFetchingNextPage: query.isFetching && !!cursor,
  }
}

