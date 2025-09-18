import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchPublicCatalogItems,
  PublicCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog';
import type { SortOrder } from '@/state/catalogFiltersStore';
import { stateKeyFragment } from '@/lib/catalogState';

export type { PublicCatalogItem };

export function useCatalogProducts(filters: PublicCatalogFilters, sort: SortOrder) {
  const queryClient = useQueryClient();
  const [allItems, setAllItems] = useState<PublicCatalogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const channel: any = (supabase as any)?.channel?.('catalog-products');
    if (!channel?.on) return;

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

    channel.subscribe?.();

    return () => {
      channel.unsubscribe?.();
    };
  }, [queryClient]);

  // Create a stable key for the base query (without cursor)
  const { cursor, ...baseFilters } = filters;
  const baseStateHash = stateKeyFragment({ filters: baseFilters, sort } as any);

  // Reset accumulated data when base filters change
  useEffect(() => {
    setAllItems([]);
    setNextCursor(null);
    setTotal(0);
  }, [baseStateHash]);

  const query = useQuery({
    queryKey: ['catalog', baseStateHash, cursor || 'initial'],
    queryFn: () => fetchPublicCatalogItems(filters, sort),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    gcTime: 900_000,
  });

  // Accumulate results when new data arrives
  useEffect(() => {
    if (query.data) {
      const { items, nextCursor: newNextCursor, total: newTotal } = query.data as any;
      console.log('useCatalogProducts: Received data - items:', items?.length, 'nextCursor:', newNextCursor, 'cursor:', cursor)
      
      if (cursor) {
        // This is a "load more" request - append new items
        setAllItems(prev => {
          const merged = [...prev, ...items];
          console.log('useCatalogProducts: Appending items - prev:', prev.length, 'new:', items.length, 'merged:', merged.length)
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
        console.log('useCatalogProducts: Initial load - replacing with', items?.length, 'items')
        setAllItems(items || []);
      }
      
      setNextCursor(newNextCursor);
      setTotal(newTotal || 0);
    }
  }, [query.data, cursor]);

  const loadMore = useCallback(() => {
    if (nextCursor && !query.isFetching) {
      console.log('useCatalogProducts: Loading more with cursor:', nextCursor)
      // Create new filters with cursor and directly refetch
      const newFilters = { ...filters, cursor: nextCursor }
      const newStateHash = stateKeyFragment({ filters: newFilters, sort } as any)
      
      queryClient.fetchQuery({
        queryKey: ['catalog', newStateHash, nextCursor],
        queryFn: () => fetchPublicCatalogItems(newFilters, sort),
        staleTime: 30_000,
      })
    } else {
      console.log('useCatalogProducts: Cannot load more - nextCursor:', nextCursor, 'isFetching:', query.isFetching)
    }
  }, [nextCursor, query.isFetching, queryClient, filters, sort]);

  return {
    ...query,
    data: allItems,
    nextCursor,
    total,
    loadMore,
    hasNextPage: !!nextCursor,
    isFetchingNextPage: query.isFetching && !!cursor,
  };
}

