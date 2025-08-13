
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/lib/types/database'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

export function useSupplierItems(supplierId?: string) {
  return useQuery({
    queryKey: ['supplier-items', supplierId],
    queryFn: async (): Promise<SupplierItem[]> => {
      let query = supabase
        .from('supplier_items')
        .select(`
          *,
          supplier:suppliers(name),
          pack_unit:units(code, name),
          category:categories(name, vat_code)
        `)

      if (supplierId) {
        query = query.eq('supplier_id', supplierId)
      }

      const { data, error } = await query.order('display_name')

      if (error) throw error
      return data || []
    },
    enabled: !supplierId || !!supplierId
  })
}
