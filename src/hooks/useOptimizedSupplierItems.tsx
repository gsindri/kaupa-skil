
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/AuthProvider'

interface SupplierItemsFilters {
  search?: string
  supplierId?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  category?: string
  limit?: number
  offset?: number
}

export function useOptimizedSupplierItems(filters: SupplierItemsFilters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.suppliers.items(filters.supplierId, filters),
    queryFn: async () => {
      let query = supabase
        .from('supplier_items')
        .select(`
          *,
          supplier:suppliers(name, id)
        `)
        .order('name')

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      
      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock)
      }
      
      if (filters.minPrice) {
        query = query.gte('price_ex_vat', filters.minPrice)
      }
      
      if (filters.maxPrice) {
        query = query.lte('price_ex_vat', filters.maxPrice)
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      // Pagination
      if (filters.limit) {
        const from = filters.offset || 0
        const to = from + filters.limit - 1
        query = query.range(from, to)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    // Optimize for large datasets
    staleTime: filters.search ? 30000 : 1000 * 60 * 5, // Shorter stale time for searches
    gcTime: 1000 * 60 * 15, // Keep search results longer
    // Use placeholderData to prevent loading states during filter changes
    placeholderData: (previousData) => previousData,
  })
}
