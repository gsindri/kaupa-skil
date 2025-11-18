import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface InventoryItem {
  id: string
  name: string
  brand: string | null
  supplier_name: string
  pack_size: string | null
  availability_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'
  last_ordered_at: string | null
}

export function useInventory() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  return useQuery<InventoryItem[]>({
    queryKey: [...queryKeys.dashboard.inventory(), tenantId],
    enabled: !!tenantId,
    staleTime: 120_000,
    queryFn: async () => {
      if (!tenantId) {
        return []
      }

      // Get supplier products from connected suppliers
      const { data: credentials } = await supabase
        .from('supplier_credentials')
        .select('supplier_id')
        .eq('tenant_id', tenantId)

      if (!credentials || credentials.length === 0) {
        return []
      }

      const supplierIds = credentials.map(c => c.supplier_id)

      const { data: items, error } = await supabase
        .from('supplier_product')
        .select(`
          id,
          supplier_id,
          supplier_sku,
          pack_size,
          active_status,
          catalog_product_id,
          catalog_product(name, brand),
          supplier_product_availability(status)
        `)
        .in('supplier_id', supplierIds)
        .eq('active_status', 'ACTIVE')
        .limit(100)

      if (error) {
        console.warn('Error fetching inventory:', error)
        return []
      }

      // Get supplier names
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .in('id', supplierIds)

      const supplierMap = new Map(suppliers?.map(s => [s.id, s.name]) || [])

      return items?.map(item => ({
        id: item.id,
        name: (item.catalog_product as any)?.name || item.supplier_sku,
        brand: (item.catalog_product as any)?.brand || null,
        supplier_name: supplierMap.get(item.supplier_id) || item.supplier_id,
        pack_size: item.pack_size,
        availability_status: (item.supplier_product_availability as any)?.status || 'UNKNOWN',
        last_ordered_at: null // Could join with order_lines if needed
      })) || []
    }
  })
}
