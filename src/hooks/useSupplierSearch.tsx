import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Category {
  id: string
  name: string
  name_is: string
  slug: string
}

export interface EnhancedSupplier {
  id: string
  name: string
  display_name: string
  legal_name: string | null
  kennitala: string | null
  logo_url: string | null
  short_description: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  coverage_areas: string[] | null
  badges: string[] | null
  avg_lead_time_days: number | null
  min_order_isk: number | null
  verification_status: string
  is_featured: boolean
  categories: Category[]
  similarity_score: number
}

interface UseSupplierSearchParams {
  query?: string
  categoryIds?: string[]
  featuredOnly?: boolean
  limit?: number
  offset?: number
}

export function useSupplierSearch({
  query,
  categoryIds,
  featuredOnly = false,
  limit = 24,
  offset = 0,
}: UseSupplierSearchParams) {
  return useQuery({
    queryKey: ['supplier-search', query, categoryIds, featuredOnly, limit, offset],
    queryFn: async (): Promise<EnhancedSupplier[]> => {
      const { data, error } = await supabase.rpc('search_suppliers', {
        search_query: query || null,
        category_ids: categoryIds || null,
        featured_only: featuredOnly,
        limit_count: limit,
        offset_count: offset,
      })

      if (error) throw error
      
      return (data || []).map((item: any) => ({
        ...item,
        categories: typeof item.categories === 'string' 
          ? JSON.parse(item.categories) 
          : item.categories || []
      }))
    },
  })
}

export function useFeaturedSuppliers() {
  return useSupplierSearch({
    featuredOnly: true,
    limit: 12,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    },
  })
}
