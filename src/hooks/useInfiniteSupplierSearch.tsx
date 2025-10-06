import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { EnhancedSupplier } from './useSupplierSearch'

interface UseInfiniteSupplierSearchParams {
  query?: string
  categoryIds?: string[]
  featuredOnly?: boolean
  pageSize?: number
}

export function useInfiniteSupplierSearch({
  query,
  categoryIds,
  featuredOnly = false,
  pageSize = 24,
}: UseInfiniteSupplierSearchParams) {
  const [allSuppliers, setAllSuppliers] = useState<EnhancedSupplier[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const { isLoading, isFetching } = useQuery({
    queryKey: ['supplier-search-infinite', query, categoryIds, featuredOnly, offset],
    queryFn: async (): Promise<EnhancedSupplier[]> => {
      const { data, error } = await supabase.rpc('search_suppliers', {
        search_query: query || null,
        category_ids: categoryIds || null,
        featured_only: featuredOnly,
        limit_count: pageSize,
        offset_count: offset,
      })

      if (error) throw error
      
      const mapped = (data || []).map((item: any) => ({
        ...item,
        categories: typeof item.categories === 'string' 
          ? JSON.parse(item.categories) 
          : item.categories || []
      }))

      // Update state
      if (offset === 0) {
        setAllSuppliers(mapped)
      } else {
        setAllSuppliers(prev => [...prev, ...mapped])
      }

      // Check if there are more results
      setHasMore(mapped.length === pageSize)

      return mapped
    },
    enabled: hasMore || offset === 0,
  })

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset(prev => prev + pageSize)
    }
  }, [isFetching, hasMore, pageSize])

  // Reset when search params change
  const reset = useCallback(() => {
    setOffset(0)
    setAllSuppliers([])
    setHasMore(true)
  }, [])

  // Trigger reset when search params change
  const searchKey = JSON.stringify({ query, categoryIds, featuredOnly })
  const [lastSearchKey, setLastSearchKey] = useState(searchKey)
  
  if (searchKey !== lastSearchKey) {
    setLastSearchKey(searchKey)
    reset()
  }

  return {
    data: allSuppliers,
    isLoading: isLoading && offset === 0,
    isFetchingNextPage: isFetching && offset > 0,
    hasMore,
    loadMore,
  }
}
