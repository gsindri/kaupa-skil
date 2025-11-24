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

      // 1. Fetch draft orders with lines
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
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
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'draft')

      if (error) {
        console.error('Error loading cart from DB:', error)
        throw error
      }

      if (!orders || orders.length === 0) {
        return []
      }

      // Flatten all order lines
      const allLines = orders.flatMap(o =>
        (o.order_lines || []).map(line => ({ ...line, orderId: o.id }))
      )

      if (allLines.length === 0) return []

      // 2. Collect IDs
      const supplierProductIds = [...new Set(allLines.map(l => l.supplier_product_id))]

      // 3. Batch fetch Supplier Products
      const { data: supplierProducts, error: spError } = await supabase
        .from('supplier_product')
        .select(`
          id, 
          supplier_id, 
          supplier_sku, 
          pack_size, 
          catalog_product_id, 
          image_url, 
          catalog_product(name, brand)
        `)
        .in('id', supplierProductIds)

      if (spError) throw spError

      const spMap = new Map(supplierProducts?.map(sp => [sp.id, sp]))
      const supplierIds = [...new Set(supplierProducts?.map(sp => sp.supplier_id))]

      // 4. Batch fetch Suppliers
      const { data: suppliers, error: sError } = await supabase
        .from('suppliers')
        .select('id, name, logo_url, display_name')
        .in('id', supplierIds)

      if (sError) throw sError

      const supplierMap = new Map(suppliers?.map(s => [s.id, s]))

      // 5. Batch fetch Active Offers
      const now = new Date().toISOString()
      const { data: offers, error: oError } = await supabase
        .from('supplier_offer')
        .select('id, supplier_product_id, pack_price, availability_status')
        .in('supplier_product_id', supplierProductIds)
        .lte('valid_from', now)
        .or(`valid_to.is.null,valid_to.gt.${now}`)
        .order('valid_from', { ascending: false })

      if (oError) throw oError

      // Group offers by supplier_product_id to find the best one (first one due to sort)
      const offerMap = new Map()
      offers?.forEach(offer => {
        if (!offerMap.has(offer.supplier_product_id)) {
          offerMap.set(offer.supplier_product_id, offer)
        }
      })

      // 6. Construct CartItems
      const cartItems: CartItem[] = []

      for (const line of allLines) {
        const sp = spMap.get(line.supplier_product_id)
        if (!sp) continue

        const supplier = supplierMap.get(sp.supplier_id)
        const currentOffer = offerMap.get(line.supplier_product_id)
        const catalogProduct = sp.catalog_product as any

        // Use current offer price if available, otherwise use snapshot
        const currentPrice = currentOffer?.pack_price || line.unit_price_per_pack

        cartItems.push({
          id: sp.catalog_product_id || sp.id,
          supplierItemId: sp.catalog_product_id || sp.id,
          supplierId: sp.supplier_id,
          supplierName: supplier?.display_name || supplier?.name || sp.supplier_id,
          supplierLogoUrl: supplier?.logo_url || null,
          itemName: catalogProduct?.name || 'Unknown Item',
          displayName: catalogProduct?.name || 'Unknown Item',
          sku: sp.supplier_sku,
          packSize: line.pack_size || sp.pack_size || '',
          packPrice: currentPrice || null,
          unitPriceExVat: currentPrice ? currentPrice / 1.24 : null,
          unitPriceIncVat: currentPrice || null,
          quantity: line.quantity_packs,
          vatRate: 0.24,
          unit: 'pack',
          packQty: 1,
          image: sp.image_url || null,

          // Database identifiers for authenticated cart persistence
          orderLineId: line.id,
          orderId: line.orderId,
          offerId: currentOffer?.id,
          availabilityStatus: currentOffer?.availability_status,

          // Price snapshot for drift detection
          snapshotPrice: line.unit_price_per_pack,
        })
      }

      console.log('Loaded cart items from DB (Batched):', cartItems)
      return cartItems
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0, // Always fetch fresh cart data
  })
}
