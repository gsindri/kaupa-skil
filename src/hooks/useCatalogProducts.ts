import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'

export interface CatalogFilters {
  brand?: string
  supplier?: string
  category?: string
}

export interface CatalogProduct {
  id: string
  name: string
  brand: string
  pack: string
  image?: string
  suppliers: string[]
}

export function useCatalogProducts(search: string, filters: CatalogFilters) {
  return useQuery({
    queryKey: queryKeys.catalog.list({ search, ...filters }),
    queryFn: async (): Promise<CatalogProduct[]> => {
      let query: any = supabase.from('v_public_catalog').select('*')

      if (search) {
        query = query.textSearch('search_vector', search)
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand)
      }
      if (filters.supplier) {
        query = query.contains('supplier_names', [filters.supplier])
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.catalog_id,
        name: item.name,
        brand: item.brand,
        pack: item.size,
        image: item.image_main,
        suppliers: item.supplier_names || []
      }))
    }
  })
}

export type { CatalogProduct }
