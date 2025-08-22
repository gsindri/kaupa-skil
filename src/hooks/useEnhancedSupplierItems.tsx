
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/useAuth'
import { handleQueryError, createDedupedQuery } from '@/lib/queryErrorHandler'
import { useTenantValidation } from './useTenantValidation'
import { useAuditLogger } from './useAuditLogger'

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

// Create deduplicated query function
const dedupedSupplierItemsQuery = createDedupedQuery(
  async (filters: SupplierItemsFilters, tenantId: string) => {
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

    // Pagination with security limits
    const maxLimit = 1000 // Prevent excessive data requests
    const safeLimit = Math.min(filters.limit || 100, maxLimit)
    const safeOffset = Math.max(filters.offset || 0, 0)
    
    if (safeLimit) {
      query = query.range(safeOffset, safeOffset + safeLimit - 1)
    }

    const { data, error } = await query

    if (error) {
      handleQueryError(error, 'enhanced supplier items')
      throw error
    }
    
    return data || []
  }
)

export function useEnhancedSupplierItems(filters: SupplierItemsFilters = {}) {
  const { user, profile } = useAuth()
  const { logDataAccess } = useAuditLogger()
  const { data: tenantValidation } = useTenantValidation(profile?.tenant_id ?? undefined)

  return useQuery({
    queryKey: queryKeys.suppliers.items(filters.supplierId ?? undefined, filters),
    queryFn: async () => {
      if (!tenantValidation?.isValid) {
        throw new Error('Invalid tenant context')
      }

      const data = await dedupedSupplierItemsQuery(filters, profile!.tenant_id)
      
      // Log data access for audit purposes
      logDataAccess('supplier_items', 'bulk_access', 'query_supplier_items')
      
      return data
    },
    enabled: !!user && !!tenantValidation?.isValid,
    // Enhanced caching strategy
    staleTime: filters.search ? 30000 : 1000 * 60 * 5, // Shorter for searches
    gcTime: 1000 * 60 * 15, // Longer retention for frequently accessed data
    // Use placeholderData to prevent loading states during filter changes
    placeholderData: (previousData) => previousData,
    // Enhanced error handling
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('Invalid tenant context') || 
          (error as any)?.code === 'PGRST301') {
        return false
      }
      return failureCount < 2
    },
    // Network-first for security-sensitive data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
