
import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/contexts/CartProvider'
import { supabase } from '@/integrations/supabase/client'
import { OrderSummaryCard } from './OrderSummaryCard'
import { SupplierOrderCard } from './SupplierOrderCard'
import type { CartItem } from '@/lib/types'

interface SupplierOrder {
  supplierId: string
  supplierName: string
  items: CartItem[]
  totalExVat: number
  totalIncVat: number
  vatAmount: number
}

export function OrderComposerRefactored() {
  const [notes, setNotes] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const approvalThreshold = 200000

  const { profile } = useAuth()
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCart()
  const { toast } = useToast()

  const supplierOrders = useMemo(() => {
    const orders: { [key: string]: SupplierOrder } = {}

    cartItems.forEach(item => {
      if (!orders[item.supplierId]) {
        orders[item.supplierId] = {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          items: [],
          totalExVat: 0,
          totalIncVat: 0,
          vatAmount: 0
        }
      }

      orders[item.supplierId].items.push(item)
      
      const lineExVat = item.packPrice * item.quantity
      const lineIncVat = lineExVat * (1 + item.vatRate)
      
      orders[item.supplierId].totalExVat += lineExVat
      orders[item.supplierId].totalIncVat += lineIncVat
      orders[item.supplierId].vatAmount += (lineIncVat - lineExVat)
    })

    return Object.values(orders)
  }, [cartItems])

  const grandTotal = useMemo(() => {
    return supplierOrders.reduce((total, order) => ({
      exVat: total.exVat + order.totalExVat,
      incVat: total.incVat + order.totalIncVat,
      vat: total.vat + order.vatAmount
    }), { exVat: 0, incVat: 0, vat: 0 })
  }, [supplierOrders])

  const needsApproval = grandTotal.incVat > approvalThreshold

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleDispatchOrders = async () => {
    if (!profile?.tenant_id || supplierOrders.length === 0) return

    setDispatching(true)
    try {
      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: profile.tenant_id,
          created_by: profile.id,
          status: 'submitted',
          notes: notes
        })
        .select()
        .single()

      if (orderError) throw orderError
      if (!order) throw new Error('Failed to create order')

      // Create order lines
      const orderLines = cartItems.map(item => ({
        order_id: order.id,
        supplier_id: item.supplierId,
        supplier_item_id: item.supplierItemId,
        qty_packs: item.quantity,
        pack_price: item.packPrice,
        unit_price_ex_vat: item.unitPriceExVat,
        unit_price_inc_vat: item.unitPriceIncVat,
        vat_rate: item.vatRate,
        line_total: item.packPrice * item.quantity
      }))

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines)

      if (linesError) throw linesError

      // Create dispatch records for each supplier
      const dispatches = supplierOrders.map(supplierOrder => ({
        order_id: order.id,
        supplier_id: supplierOrder.supplierId,
        status: 'pending' as const,
        attachments: []
      }))

      const { error: dispatchError } = await supabase
        .from('order_dispatches')
        .insert(dispatches)

      if (dispatchError) throw dispatchError

      toast({
        title: 'Orders dispatched successfully',
        description: `${supplierOrders.length} orders have been sent to suppliers.`,
      })

      clearCart()
      setNotes('')

    } catch (error: any) {
      console.error('Order dispatch error:', error)
      toast({
        title: 'Error dispatching orders',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setDispatching(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground">
            Add items from the price comparison table to start building your order.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <OrderSummaryCard
        itemCount={cartItems.length}
        totals={grandTotal}
        needsApproval={needsApproval}
        approvalThreshold={approvalThreshold}
        dispatching={dispatching}
        onDispatchOrders={handleDispatchOrders}
        onClearCart={clearCart}
        formatPrice={formatPrice}
      />

      {/* Supplier Orders */}
      {supplierOrders.map((supplierOrder) => (
        <SupplierOrderCard
          key={supplierOrder.supplierId}
          supplierId={supplierOrder.supplierId}
          supplierName={supplierOrder.supplierName}
          items={supplierOrder.items}
          totalExVat={supplierOrder.totalExVat}
          totalIncVat={supplierOrder.totalIncVat}
          vatAmount={supplierOrder.vatAmount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          formatPrice={formatPrice}
        />
      ))}

      {/* Order Notes */}
      <Card>
        <CardContent className="p-4">
          <Textarea
            placeholder="Add any special instructions or notes for this order..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  )
}
