
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

export interface ComparisonItem {
  id: string
  itemName: string
  brand?: string
  category?: string
  suppliers: SupplierQuote[]
}

export interface SupplierQuote {
  id: string
  name: string
  packSize: string
  unitPriceIncVat: number
  inStock: boolean
}

export function useComparisonItems() {
  const { profile } = useAuth()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['comparison-items', profile?.tenant_id ?? 'no-tenant'],
    queryFn: async (): Promise<ComparisonItem[]> => {
      let query = supabase
        .from('supplier_items')
        .select(`
          id,
          display_name,
          brand,
          category:categories(name),
          pack_size,
          in_stock,
          supplier:suppliers!inner(id, name, tenant_id),
          price_quotes(unit_price_inc_vat)
        `)

      if (profile?.tenant_id) {
        query = query.eq('supplier.tenant_id', profile.tenant_id)
      } else {
        query = query.is('supplier.tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error

      const itemsMap: Record<string, ComparisonItem> = {}

      for (const row of data || []) {
        const key = row.display_name
        if (!itemsMap[key]) {
          itemsMap[key] = {
            id: row.id,
            itemName: row.display_name,
            brand: row.brand || undefined,
            category: row.category?.[0]?.name || undefined,
            suppliers: []
          }
        }

        const quote = Array.isArray(row.price_quotes) ? row.price_quotes[0] : null

        itemsMap[key].suppliers.push({
          id: row.supplier?.[0]?.id,
          name: row.supplier?.[0]?.name,
          packSize: row.pack_size ? String(row.pack_size) : '',
          unitPriceIncVat: quote?.unit_price_inc_vat ?? 0,
          inStock: row.in_stock ?? false
        })
      }

      return Object.values(itemsMap)
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Extract unique suppliers and categories
  const suppliers = Array.from(
    new Set(
      items.flatMap(item => 
        item.suppliers.map(supplier => supplier.name)
      )
    )
  ).map(name => ({ label: name, value: name }))

  const categories = Array.from(
    new Set(
      items.map(item => item.category).filter(Boolean)
    )
  ).map(category => ({ label: category!, value: category! }))

  return {
    items,
    isLoading,
    suppliers,
    categories
  }
}
