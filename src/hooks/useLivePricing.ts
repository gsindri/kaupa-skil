import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'

export interface PriceDrift {
  lineId: string
  productName: string
  oldPrice: number
  newPrice: number
  driftPercent: number
  quantity: number
  direction: 'increase' | 'decrease'
}

export interface LivePricingResult {
  items: CartItem[]
  drifts: PriceDrift[]
  totalOld: number
  totalNew: number
  lastValidated: string | null
  isStale: boolean
}

export function useLivePricing(orderId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['live-pricing', orderId],
    queryFn: async (): Promise<LivePricingResult> => {
      if (!orderId) {
        return {
          items: [],
          drifts: [],
          totalOld: 0,
          totalNew: 0,
          lastValidated: null,
          isStale: false,
        }
      }

      // Fetch order with lines and current offers
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          supplier_id,
          prices_last_validated_at,
          order_lines (
            id,
            supplier_product_id,
            quantity_packs,
            unit_price_per_pack,
            pack_size,
            line_total,
            offer_id,
            supplier_product!inner (
              id,
              supplier_id,
              supplier_sku,
              pack_size,
              catalog_product_id,
              image_url,
              catalog_product (
                name,
                brand
              )
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      if (!order || !order.order_lines) {
        return {
          items: [],
          drifts: [],
          totalOld: 0,
          totalNew: 0,
          lastValidated: null,
          isStale: false,
        }
      }

      // Fetch current offers for all products
      const productIds = order.order_lines.map((line: any) => line.supplier_product_id)
      const { data: currentOffers } = await supabase
        .from('supplier_offer')
        .select('id, supplier_product_id, pack_price, availability_status')
        .in('supplier_product_id', productIds)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_to.is.null,valid_to.gt.${new Date().toISOString()}`)

      const offerMap = new Map(
        (currentOffers || []).map(offer => [offer.supplier_product_id, offer])
      )

      // Process lines and detect drift
      const drifts: PriceDrift[] = []
      const items: CartItem[] = []
      let totalOld = 0
      let totalNew = 0

      for (const line of order.order_lines as any[]) {
        const supplierProduct = line.supplier_product
        const catalogProduct = supplierProduct.catalog_product
        const currentOffer = offerMap.get(line.supplier_product_id)
        
        const snapshotPrice = line.unit_price_per_pack || 0
        const currentPrice = currentOffer?.pack_price || snapshotPrice
        
        // Detect drift
        if (snapshotPrice > 0 && Math.abs(currentPrice - snapshotPrice) > 0.01) {
          const driftPercent = ((currentPrice - snapshotPrice) / snapshotPrice) * 100
          
          drifts.push({
            lineId: line.id,
            productName: catalogProduct?.name || 'Unknown',
            oldPrice: snapshotPrice,
            newPrice: currentPrice,
            driftPercent: Math.abs(driftPercent),
            quantity: line.quantity_packs,
            direction: currentPrice > snapshotPrice ? 'increase' : 'decrease',
          })
        }

        totalOld += snapshotPrice * line.quantity_packs
        totalNew += currentPrice * line.quantity_packs

        // Fetch supplier details
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('name, logo_url, display_name')
          .eq('id', supplierProduct.supplier_id)
          .single()

        items.push({
          id: catalogProduct?.id || supplierProduct.id,
          supplierItemId: catalogProduct?.id || supplierProduct.id,
          supplierId: supplierProduct.supplier_id,
          supplierName: supplier?.display_name || supplier?.name || supplierProduct.supplier_id,
          supplierLogoUrl: supplier?.logo_url || null,
          itemName: catalogProduct?.name || 'Unknown',
          displayName: catalogProduct?.name || 'Unknown',
          sku: supplierProduct.supplier_sku,
          packSize: line.pack_size || supplierProduct.pack_size || '',
          packPrice: currentPrice,
          unitPriceExVat: currentPrice / 1.24,
          unitPriceIncVat: currentPrice,
          quantity: line.quantity_packs,
          vatRate: 0.24,
          unit: 'pack',
          packQty: 1,
          image: supplierProduct.image_url || null,
          orderLineId: line.id,
          orderId: order.id,
          offerId: currentOffer?.id,
          availabilityStatus: currentOffer?.availability_status,
        })
      }

      // Check if prices are stale (> 5 minutes)
      const lastValidated = order.prices_last_validated_at
      const isStale = !lastValidated || 
        (Date.now() - new Date(lastValidated).getTime()) > 5 * 60 * 1000

      return {
        items,
        drifts,
        totalOld,
        totalNew,
        lastValidated,
        isStale,
      }
    },
    enabled: enabled && !!orderId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })
}
