
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
            },
            {
              id: 'sup3',
              name: 'Véfkaupmenn',
              packSize: '750ml',
              unitPriceIncVat: 950,
              inStock: false
            }
          ]
        },
        {
          id: '2',
          itemName: 'Organic Tomatoes',
          brand: 'Fresh Nordic',
          category: 'Fresh Produce',
          suppliers: [
            {
              id: 'sup2',
              name: 'Metro',
              packSize: '1kg',
              unitPriceIncVat: 450,
              inStock: true
            },
            {
              id: 'sup4',
              name: 'Nordic Fresh',
              packSize: '500g',
              unitPriceIncVat: 280,
              inStock: true
            }
          ]
        },
        {
          id: '3',
          itemName: 'Premium Salmon Fillet',
          brand: 'Iceland Seafood',
          category: 'Seafood',
          suppliers: [
            {
              id: 'sup3',
              name: 'Véfkaupmenn',
              packSize: '1kg',
              unitPriceIncVat: 3200,
              inStock: true
            },
            {
              id: 'sup5',
              name: 'Iceland Seafood',
              packSize: '500g',
              unitPriceIncVat: 1800,
              inStock: true
            }
          ]
        },
        {
          id: '4',
          itemName: 'Artisan Bread',
          brand: 'Reykjavik Bakehouse',
          category: 'Bakery',
          suppliers: [
            {
              id: 'sup6',
              name: 'Reykjavik Bakehouse',
              packSize: '500g',
              unitPriceIncVat: 320,
              inStock: true
            },
            {
              id: 'sup2',
              name: 'Metro',
              packSize: '400g',
              unitPriceIncVat: 280,
              inStock: false
            }
          ]
        },
        {
          id: '5',
          itemName: 'Organic Milk',
          brand: 'MS Dairies',
          category: 'Dairy Products',
          suppliers: [
            {
              id: 'sup1',
              name: 'Costco',
              packSize: '1L',
              unitPriceIncVat: 180,
              inStock: true
            },
            {
              id: 'sup2',
              name: 'Metro',
              packSize: '1L',
              unitPriceIncVat: 195,
              inStock: true
            },
            {
              id: 'sup3',
              name: 'Véfkaupmenn',
              packSize: '1L',
              unitPriceIncVat: 185,
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
