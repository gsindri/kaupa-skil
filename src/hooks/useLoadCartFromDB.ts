import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import type { CartItem } from '@/lib/types/index'

export function useLoadCartFromDB() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [...queryKeys.orders.all(), 'cart', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) {
        return []
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          supplier_id,
          order_lines(
            id,
            supplier_product_id,
            quantity_packs,
            unit_price_per_pack,
            pack_size,
            line_total
          )
        `
        )
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'draft')

      if (error) {
        console.error('Error loading cart from DB:', error)
        throw error
      }

      if (!orders || orders.length === 0) {
        return []
      }

      // Convert draft orders to CartItem format
      const cartItems: CartItem[] = []

      for (const order of orders) {
        if (!order.order_lines || order.order_lines.length === 0) continue

        for (const line of order.order_lines) {
          // We need to fetch supplier product details to populate CartItem properly
          const { data: supplierProduct } = await supabase
            .from('supplier_product')
            .select('supplier_id, supplier_sku, pack_size, catalog_product_id, catalog_product(name, brand)')
            .eq('id', line.supplier_product_id)
            .single()

          if (!supplierProduct) continue

          // Fetch supplier details
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('name, logo_url, display_name')
            .eq('id', supplierProduct.supplier_id)
            .single()

          const catalogProduct = supplierProduct.catalog_product as any

          cartItems.push({
            id: supplierProduct.catalog_product_id,
            supplierItemId: supplierProduct.catalog_product_id,
            supplierId: supplierProduct.supplier_id,
            supplierName: supplier?.display_name || supplier?.name || supplierProduct.supplier_id,
            supplierLogoUrl: supplier?.logo_url || null,
            itemName: catalogProduct?.name || 'Unknown Item',
            displayName: catalogProduct?.name || 'Unknown Item',
            sku: supplierProduct.supplier_sku,
            packSize: line.pack_size || supplierProduct.pack_size || '',
            packPrice: line.unit_price_per_pack,
            unitPriceExVat: line.unit_price_per_pack / 1.24, // Assuming 24% VAT
            unitPriceIncVat: line.unit_price_per_pack,
            quantity: line.quantity_packs,
            vatRate: 0.24,
            unit: 'pack',
            packQty: 1,
            image: null,
            
            // Database identifiers for authenticated cart persistence
            orderLineId: line.id,
            orderId: order.id,
          })
        }
      }

      return cartItems
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0, // Always fetch fresh cart data
  })
}
