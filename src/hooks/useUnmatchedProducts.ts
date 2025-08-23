import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'

export interface UnmatchedProduct {
  unmatched_id: string
  supplier_id: string
  supplier_sku: string
  raw_name: string
  attempted_match: string | null
  inserted_at: string
}

export function useUnmatchedProducts() {
  return useQuery({
    queryKey: queryKeys.catalog.unmatched(),
    queryFn: async (): Promise<UnmatchedProduct[]> => {
      const { data, error } = await supabase
        .from('unmatched_products')
        .select('*')
        .order('inserted_at', { ascending: false })
      if (error) throw error
      return (data || []) as UnmatchedProduct[]
    }
  })
}
