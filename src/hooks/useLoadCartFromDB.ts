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

      // Fetch draft orders with offer data for live pricing
      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          supplier_id,
          prices_last_validated_at,
          order_lines(
            id,
            supplier_product_id,
            quantity_packs,
            unit_price_per_pack,
            pack_size,
            line_total,
            offer_id
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
          // Fetch supplier product and current offer for live pricing
          const { data: supplierProduct } = await supabase
            .from('supplier_product')
            .select('id, supplier_id, supplier_sku, pack_size, catalog_product_id, image_url, catalog_product(name, brand)')
            .eq('id', line.supplier_product_id)
            .single()

          if (!supplierProduct) continue

          // Fetch current offer if available
          const { data: currentOffer } = await supabase
            .from('supplier_offer')
            .select('id, pack_price, availability_status')
            .eq('supplier_product_id', line.supplier_product_id)
            .lte('valid_from', new Date().toISOString())
            .or(`valid_to.is.null,valid_to.gt.${new Date().toISOString()}`)
            .order('valid_from', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Use current offer price if available, otherwise use snapshot
          const currentPrice = currentOffer?.pack_price || line.unit_price_per_pack

          // Fetch supplier details
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('name, logo_url, display_name')
            .eq('id', supplierProduct.supplier_id)
            .single()

          const catalogProduct = supplierProduct.catalog_product as any

          cartItems.push({
            id: supplierProduct.catalog_product_id || supplierProduct.id,
            supplierItemId: supplierProduct.catalog_product_id || supplierProduct.id,
            supplierId: supplierProduct.supplier_id,
            supplierName: supplier?.display_name || supplier?.name || supplierProduct.supplier_id,
            supplierLogoUrl: supplier?.logo_url || null,
            itemName: catalogProduct?.name || 'Unknown Item',
            displayName: catalogProduct?.name || 'Unknown Item',
            sku: supplierProduct.supplier_sku,
            packSize: line.pack_size || supplierProduct.pack_size || '',
            packPrice: currentPrice || null,
            unitPriceExVat: currentPrice ? currentPrice / 1.24 : null,
            unitPriceIncVat: currentPrice || null,
            quantity: line.quantity_packs,
            vatRate: 0.24,
            unit: 'pack',
            packQty: 1,
            image: supplierProduct.image_url || null,

            // Database identifiers for authenticated cart persistence
            orderLineId: line.id,
            orderId: order.id,
            offerId: currentOffer?.id,
            availabilityStatus: currentOffer?.availability_status,
            
            // Price snapshot for drift detection
            snapshotPrice: line.unit_price_per_pack,
          })
        }
      }

      console.log('Loaded cart items from DB:', cartItems)
      return cartItems
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0, // Always fetch fresh cart data
  })
}
