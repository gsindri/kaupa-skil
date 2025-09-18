import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseInfiniteQueryOptions<T> {
  queryKey: (cursor?: string) => string[];
  queryFn: (cursor?: string) => Promise<{
    items: T[];
    nextCursor?: string;
    total?: number;
  }>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useInfiniteQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 30_000,
  gcTime = 900_000,
}: UseInfiniteQueryOptions<T>) {
  const queryClient = useQueryClient();
  const [allItems, setAllItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [total, setTotal] = useState<number>(0);
  const currentCursor = useRef<string | undefined>();

  // Main query for current page
  const query = useQuery({
    queryKey: queryKey(currentCursor.current),
    queryFn: () => queryFn(currentCursor.current),
    enabled,
    staleTime,
    gcTime,
  });

  // Handle data accumulation when query succeeds
  useEffect(() => {
    if (query.data) {
      const { items, nextCursor: newNextCursor, total: newTotal } = query.data;
      
      if (currentCursor.current) {
        // This is a "load more" request - append items
        setAllItems(prev => {
          const merged = [...prev, ...items];
          // Deduplicate if items have an id field
          const seen = new Set();
          return merged.filter((item: any) => {
            const id = item.id || item.catalog_id || item.uuid;
            if (id && seen.has(id)) return false;
            if (id) seen.add(id);
            return true;
          });
        });
      } else {
        // This is initial load - replace all items
        setAllItems(items);
      }
      
      setNextCursor(newNextCursor);
      setTotal(newTotal || 0);
    }
  }, [query.data]);

  // Reset when query key base changes (filters/sort change)
  const baseKey = JSON.stringify(queryKey());
  useEffect(() => {
    setAllItems([]);
    setNextCursor(undefined);
    setTotal(0);
    currentCursor.current = undefined;
  }, [baseKey]);

  const loadMore = useCallback(() => {
    if (nextCursor && !query.isFetching) {
      console.log('useInfiniteQuery: Loading more with cursor:', nextCursor);
      currentCursor.current = nextCursor;
      queryClient.invalidateQueries({ queryKey: queryKey(nextCursor) });
    }
  }, [nextCursor, query.isFetching, queryClient, queryKey]);

  return {
    ...query,
    data: allItems,
    nextCursor,
    total,
    loadMore,
    hasNextPage: !!nextCursor,
    isFetchingNextPage: query.isFetching && !!currentCursor.current,
  };
}