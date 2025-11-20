import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import type { CartItem } from '@/lib/types/index'

interface AddToCartParams {
  item: CartItem
}

interface UpdateCartItemParams {
  orderId: string
  orderLineId: string
  quantity: number
  packPrice: number
}

interface RemoveCartItemParams {
  orderLineId: string
}

export function useAddToCartDB() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ item }: AddToCartParams) => {
      if (!profile?.tenant_id) {
        throw new Error('User not authenticated')
      }

      // Find or create draft order for this supplier
      const { data: existingOrders, error: orderFetchError } = await supabase
        .from('orders')
        .select('id, order_lines(id, supplier_product_id, quantity_packs, unit_price_per_pack)')
        .eq('tenant_id', profile.tenant_id)
        .eq('supplier_id', item.supplierId)
        .eq('status', 'draft')
        .limit(1)

      if (orderFetchError) throw orderFetchError

      let orderId: string

      if (existingOrders && existingOrders.length > 0) {
        orderId = existingOrders[0].id

        // Check if item already exists in order
        const existingLine = existingOrders[0].order_lines?.find(
          (line: any) => line.supplier_product_id === item.supplierItemId
        )

        if (existingLine) {
          // Update quantity
          const newQuantity = existingLine.quantity_packs + item.quantity
          const { error: updateError } = await supabase
            .from('order_lines')
            .update({
              quantity_packs: newQuantity,
              line_total: (item.packPrice || 0) * newQuantity,
            })
            .eq('id', existingLine.id)

          if (updateError) throw updateError
          return { orderId, orderLineId: existingLine.id, action: 'updated' }
        }
      } else {
        // Create new draft order
        const { data: newOrder, error: orderCreateError } = await supabase
          .from('orders')
          .insert({
            tenant_id: profile.tenant_id,
            supplier_id: item.supplierId,
            status: 'draft',
            order_date: new Date().toISOString(),
            currency: 'ISK',
            vat_included: true,
          })
          .select('id')
          .single()

        if (orderCreateError || !newOrder) throw orderCreateError
        orderId = newOrder.id
      }

      // Insert new order line
      const { data: newLine, error: lineError } = await supabase
        .from('order_lines')
        .insert({
          order_id: orderId,
          supplier_product_id: item.supplierItemId,
          quantity_packs: item.quantity,
          unit_price_per_pack: item.packPrice || 0,
          line_total: (item.packPrice || 0) * item.quantity,
          pack_size: item.packSize,
          currency: 'ISK',
          vat_included: true,
        })
        .select('id')
        .single()

      if (lineError || !newLine) throw lineError

      return { orderId, orderLineId: newLine.id, action: 'created' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
    },
  })
}

export function useUpdateCartItemDB() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderLineId, quantity, packPrice }: UpdateCartItemParams) => {
      const { error } = await supabase
        .from('order_lines')
        .update({
          quantity_packs: quantity,
          line_total: packPrice * quantity,
        })
        .eq('id', orderLineId)

      if (error) throw error
      return { orderLineId, quantity }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
    },
  })
}

export function useRemoveCartItemDB() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderLineId }: RemoveCartItemParams) => {
      const { error } = await supabase.from('order_lines').delete().eq('id', orderLineId)

      if (error) throw error
      return { orderLineId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
    },
  })
}

export function useMergeAnonymousCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ anonymousCartId, items }: { anonymousCartId: string; items: CartItem[] }) => {
      const { data, error } = await supabase.functions.invoke('merge-cart', {
        body: { anonymousCartId, items },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
    },
  })
}
