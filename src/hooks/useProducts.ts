import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { Product } from '@/components/place-order/ProductCard'

interface ProductFilters {
  supplier?: string
  category?: string
  inStock?: boolean
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async (): Promise<Product[]> => {
      let query: any = supabase
        .from('supplier_items')
        .select(`*, suppliers(name)`)

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }
      if (filters.inStock) {
        query = query.eq('in_stock', true)
      }

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.display_name,
        supplierId: item.supplier_id,
        supplierName: item.suppliers?.name ?? '',
        pack: item.pack_qty ? String(item.pack_qty) : '',
        price: item.price ?? 0,
      }))
    }
  })
}

export type { ProductFilters }

