import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/use-toast'
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

      // Resolve supplier_product.id from catalog_product_id + supplier_id
      const { data: supplierProduct, error: spError } = await supabase
        .from('supplier_product')
        .select('id')
        .eq('catalog_product_id', item.supplierItemId)
        .eq('supplier_id', item.supplierId)
        .maybeSingle()

      if (spError) throw spError

      if (!supplierProduct) {
        throw new Error(
          `No supplier product found for catalog_product_id=${item.supplierItemId} and supplier_id=${item.supplierId}`
        )
      }

      let orderId: string

      if (existingOrders && existingOrders.length > 0) {
        orderId = existingOrders[0].id

        // Check if item already exists in order (using resolved supplier_product.id)
        const existingLine = existingOrders[0].order_lines?.find(
          (line: any) => line.supplier_product_id === supplierProduct.id
        )

        if (existingLine) {
          // Update quantity
          const newQuantity = existingLine.quantity_packs + item.quantity
          const { error: updateError } = await supabase
            .from('order_lines')
            .update({
              quantity_packs: newQuantity,
              line_total: item.packPrice ? item.packPrice * newQuantity : null,
              catalog_product_id: item.supplierItemId,
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

      // Insert new order line (using resolved supplier_product.id)
      const { data: newLine, error: lineError } = await supabase
        .from('order_lines')
        .insert({
          order_id: orderId,
          supplier_product_id: supplierProduct.id,
          catalog_product_id: item.supplierItemId,
          quantity_packs: item.quantity,
          unit_price_per_pack: item.packPrice ?? null,
          line_total: item.packPrice ? item.packPrice * item.quantity : null,
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
          line_total: packPrice ? packPrice * quantity : null,
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

export function useRemoveProductFromCartDB() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ supplierItemId, supplierId, orderLineId }: { supplierItemId: string; supplierId: string; orderLineId?: string }) => {
      if (!profile?.tenant_id) throw new Error('Not authenticated')

      // supplierItemId is catalog_product_id, need to resolve to supplier_product_id
      const { data: sp, error: spError } = await supabase
        .from('supplier_product')
        .select('id')
        .eq('catalog_product_id', supplierItemId)
        .eq('supplier_id', supplierId)
        .maybeSingle()

      if (spError) {
        console.error('Failed to resolve supplier_product:', spError)
        throw spError
      }

      if (!sp) {
        console.warn(`No supplier_product found for catalog_product_id=${supplierItemId}, supplier_id=${supplierId}`)
        return { deletedCount: 0 }
      }

      // Find all draft orders for this tenant
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'draft')

      if (ordersError) throw ordersError
      if (!orders || orders.length === 0) {
        console.log('No draft orders found')
        return { deletedCount: 0 }
      }

      const orderIds = orders.map(o => o.id)

      // Delete by supplier_product_id (resolved from catalog_product_id)
      const { error: deleteError, count } = await supabase
        .from('order_lines')
        .delete({ count: 'exact' })
        .eq('supplier_product_id', sp.id)
        .in('order_id', orderIds)

      if (deleteError) {
        console.error('Failed to delete order_lines:', deleteError)
        throw deleteError
      }

      console.log(`Deleted ${count} order_line(s) for supplier_product_id=${supplierItemId}`)
      return { deletedCount: count || 0 }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })
      if (result.deletedCount > 0) {
        toast({
          title: "Item removed",
          description: `Successfully removed ${result.deletedCount} item(s) from cart`,
        })
      }
    },
    onError: (error: Error) => {
      console.error('Remove product error:', error)
      toast({
        title: "Error removing item",
        description: error.message || "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateProductQuantityDB() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      supplierItemId,
      supplierId,
      quantity,
      packPrice,
      packSize
    }: {
      supplierItemId: string
      supplierId: string
      quantity: number
      packPrice: number | null
      packSize?: string
    }) => {
      if (!profile?.tenant_id) throw new Error('Not authenticated')

      // supplierItemId is catalog_product_id, need to resolve to supplier_product_id
      const { data: sp, error: spError } = await supabase
        .from('supplier_product')
        .select('id')
        .eq('catalog_product_id', supplierItemId)
        .eq('supplier_id', supplierId)
        .maybeSingle()

      if (spError) throw spError
      if (!sp) throw new Error('Product not found')

      // Find all draft orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'draft')

      if (ordersError) throw ordersError
      if (!orders || orders.length === 0) throw new Error('No draft orders found')

      const orderIds = orders.map(o => o.id)

      // Find all existing lines
      const { data: lines, error: linesError } = await supabase
        .from('order_lines')
        .select('id, order_id')
        .eq('supplier_product_id', sp.id)
        .in('order_id', orderIds)
        .order('id') // Keep the oldest/first one

      if (linesError) throw linesError

      if (!lines || lines.length === 0) {
        // Should have existed if we are updating, but maybe it was deleted?
        // Fallback to add? No, strict update.
        throw new Error('Item not found in cart')
      }

      // 4. Update the first one, delete the rest (deduplicate)
      const [primaryLine, ...duplicates] = lines

      // Update primary
      const { error: updateError } = await supabase
        .from('order_lines')
        .update({
          quantity_packs: quantity,
          line_total: packPrice ? packPrice * quantity : null,
        })
        .eq('id', primaryLine.id)

      if (updateError) throw updateError

      // Delete duplicates
      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(d => d.id)
        const { error: deleteError } = await supabase
          .from('order_lines')
          .delete()
          .in('id', duplicateIds)

        if (deleteError) console.error('Failed to cleanup duplicates', deleteError)
      }
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
