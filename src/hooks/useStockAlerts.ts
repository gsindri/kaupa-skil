import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface StockAlert {
  id: string
  product_name: string
  supplier_name: string
  status: 'LOW_STOCK' | 'OUT_OF_STOCK'
  severity: 'high' | 'medium'
}

export function useStockAlerts() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  return useQuery<StockAlert[]>({
    queryKey: [...queryKeys.dashboard.stockAlerts(), tenantId],
    enabled: !!tenantId,
    staleTime: 120_000,
    queryFn: async () => {
      if (!tenantId) {
        return []
      }

      // Get supplier products from connected suppliers with low/out of stock
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
          catalog_product_id,
          catalog_product(name),
          supplier_product_availability!inner(status)
        `)
        .in('supplier_id', supplierIds)
        .in('supplier_product_availability.status', ['LOW_STOCK', 'OUT_OF_STOCK'])
        .limit(50)

      if (error) {
        console.warn('Error fetching stock alerts:', error)
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
        product_name: (item.catalog_product as any)?.name || item.supplier_sku,
        supplier_name: supplierMap.get(item.supplier_id) || item.supplier_id,
        status: (item.supplier_product_availability as any)?.status as 'LOW_STOCK' | 'OUT_OF_STOCK',
        severity: (item.supplier_product_availability as any)?.status === 'OUT_OF_STOCK' ? 'high' : 'medium'
      })) || []
    }
  })
}
