
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Trash2, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

interface CartItem {
  id: string
  supplierId: string
  supplierName: string
  itemName: string
  sku: string
  packSize: string
  packPrice: number
  unitPriceExVat: number
  unitPriceIncVat: number
  quantity: number
  vatRate: number
}

interface SupplierOrder {
  supplierId: string
  supplierName: string
  items: CartItem[]
  totalExVat: number
  totalIncVat: number
  vatAmount: number
}

export function OrderComposer() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    // Sample data for demonstration
    {
      id: '1',
      supplierId: 'supplier-1',
      supplierName: 'Véfkaupmenn',
      itemName: 'Extra Virgin Olive Oil',
      sku: 'VK-OLV-001',
      packSize: '500ml bottle',
      packPrice: 1890,
      unitPriceExVat: 3780,
      unitPriceIncVat: 4688,
      quantity: 2,
      vatRate: 0.24
    },
    {
      id: '2',
      supplierId: 'supplier-2',
      supplierName: 'Heilsuhúsið',
      itemName: 'Icelandic Skyr Plain',
      sku: 'HH-SKYR-PLAIN',
      packSize: '1kg container',
      packPrice: 850,
      unitPriceExVat: 850,
      unitPriceIncVat: 943,
      quantity: 5,
      vatRate: 0.24
    },
    {
      id: '3',
      supplierId: 'supplier-1',
      supplierName: 'Véfkaupmenn',
      itemName: 'Fresh Salmon Fillet',
      sku: 'VK-SAL-001',
      packSize: '1kg pack',
      packPrice: 3200,
      unitPriceExVat: 3200,
      unitPriceIncVat: 3968,
      quantity: 1,
      vatRate: 0.24
    }
  ])
  const [notes, setNotes] = useState('')
  const [dispatching, setDispatching] = useState(false)

  const { profile } = useAuth()
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

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCartItems([])
  }

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
        supplier_item_id: item.id, // This would be the actual supplier_item_id
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
        attachments: [] // TODO: Generate CSV/PDF attachments
      }))

      const { error: dispatchError } = await supabase
        .from('order_dispatches')
        .insert(dispatches)

      if (dispatchError) throw dispatchError

      toast({
        title: 'Orders dispatched successfully',
        description: `${supplierOrders.length} orders have been sent to suppliers.`,
      })

      // Clear cart after successful dispatch
      clearCart()
      setNotes('')

    } catch (error: any) {
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
      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Order Summary ({cartItems.length} items)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPrice(grandTotal.exVat)}</div>
              <div className="text-sm text-muted-foreground">Total (ex VAT)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPrice(grandTotal.vat)}</div>
              <div className="text-sm text-muted-foreground">VAT Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatPrice(grandTotal.incVat)}</div>
              <div className="text-sm text-muted-foreground">Total (inc VAT)</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button 
              onClick={handleDispatchOrders}
              disabled={dispatching}
              className="flex-1"
            >
              {dispatching ? 'Dispatching...' : 'Dispatch Orders'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Orders */}
      {supplierOrders.map((supplierOrder) => (
        <Card key={supplierOrder.supplierId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{supplierOrder.supplierName}</span>
              <Badge variant="outline">
                {supplierOrder.items.length} item{supplierOrder.items.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {item.sku} • {item.packSize}
                    </div>
                    <div className="text-sm">
                      {formatPrice(item.packPrice)} per pack
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice(item.packPrice * item.quantity)}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between text-sm">
                <span>Subtotal (ex VAT):</span>
                <span>{formatPrice(supplierOrder.totalExVat)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT:</span>
                <span>{formatPrice(supplierOrder.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total (inc VAT):</span>
                <span>{formatPrice(supplierOrder.totalIncVat)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Order Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
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
