
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/AuthProvider'
import { handleQueryError } from '@/lib/queryErrorHandler'
import { useTenantValidation } from './useTenantValidation'

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
  const { user, profile } = useAuth()
  const { data: tenantValidation } = useTenantValidation(profile?.tenant_id)

  return useQuery({
    queryKey: queryKeys.suppliers.items(filters.supplierId, filters),
    queryFn: async () => {
      // Validate tenant context before proceeding
      if (!tenantValidation?.isValid) {
        throw new Error('Invalid tenant context')
      }

      let query = supabase
        .from('supplier_items')
        .select(`
          *,
          supplier:suppliers(name, id)
        `)
        .order('name')

      // Apply filters with input validation
      if (filters.search && filters.search.trim()) {
        const sanitizedSearch = filters.search.trim().substring(0, 100) // Limit search length
        query = query.ilike('name', `%${sanitizedSearch}%`)
      }
      
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      
      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock)
      }
      
      if (filters.minPrice && filters.minPrice >= 0) {
        query = query.gte('price_ex_vat', filters.minPrice)
      }
      
      if (filters.maxPrice && filters.maxPrice >= 0) {
        query = query.lte('price_ex_vat', filters.maxPrice)
      }
      
      if (filters.category && filters.category.trim()) {
        query = query.eq('category', filters.category.trim())
      }

      // Enhanced pagination with security limits
      const maxLimit = 1000
      const safeLimit = Math.min(filters.limit || 100, maxLimit)
      const safeOffset = Math.max(filters.offset || 0, 0)
      
      if (safeLimit) {
        query = query.range(safeOffset, safeOffset + safeLimit - 1)
      }

      const { data, error } = await query

      if (error) {
        handleQueryError(error, 'supplier items')
        throw error
      }
      return data || []
    },
    enabled: !!user && !!tenantValidation?.isValid,
    // Optimize for large datasets with security considerations
    staleTime: filters.search ? 30000 : 1000 * 60 * 5, // Shorter stale time for searches
    gcTime: 1000 * 60 * 15, // Keep search results longer
    // Use placeholderData to prevent loading states during filter changes
    placeholderData: (previousData) => previousData,
    // Enhanced retry logic
    retry: (failureCount, error) => {
      if (error?.message?.includes('Invalid tenant context') || 
          (error as any)?.code === 'PGRST301') {
        return false
      }
      return failureCount < 2
    },
    // Security-focused refetch settings
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
