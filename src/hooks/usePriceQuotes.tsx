
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/lib/types/database'

type PriceQuote = Database['public']['Tables']['price_quotes']['Row']

export function usePriceQuotes(supplierItemId?: string) {
  return useQuery({
    queryKey: ['price-quotes', supplierItemId],
    queryFn: async (): Promise<PriceQuote[]> => {
      let query = supabase
        .from('price_quotes')
        .select(`
          *,
          supplier_item:supplier_items(
            display_name,
            supplier:suppliers(name)
          )
        `)

      if (supplierItemId) {
        query = query.eq('supplier_item_id', supplierItemId)
      }

      const { data, error } = await query
        .order('observed_at', { ascending: false })
        .limit(supplierItemId ? 100 : 1000)

      if (error) throw error
      return data || []
    },
    enabled: !supplierItemId || !!supplierItemId
  })
}
