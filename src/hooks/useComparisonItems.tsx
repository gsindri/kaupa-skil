
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

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
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['comparison-items'],
    queryFn: async () => {
      // Mock data for now - replace with actual Supabase query when tables are ready
      const mockItems: ComparisonItem[] = [
        {
          id: '1',
          itemName: 'Premium Olive Oil',
          brand: 'Kirkland',
          category: 'Oils & Vinegars',
          suppliers: [
            {
              id: 'sup1',
              name: 'Costco',
              packSize: '1L',
              unitPriceIncVat: 1200,
              inStock: true
            },
            {
              id: 'sup2',
              name: 'Metro',
              packSize: '500ml',
              unitPriceIncVat: 800,
              inStock: true
            }
          ]
        }
      ]
      return mockItems
    },
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
