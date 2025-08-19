
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus, Truck } from 'lucide-react'
import { useCart } from '@/contexts/BasketProviderUtils'
import { useSettings } from '@/contexts/useSettings'
import { useDeliveryCalculation, useDeliveryOptimization } from '@/hooks/useDeliveryOptimization'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { DeliveryFeeIndicator } from '@/components/delivery/DeliveryFeeIndicator'
import { OrderApprovalWorkflow } from './OrderApprovalWorkflow'
import { useToast } from '@/hooks/use-toast'

export function OrderComposer() {
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = useCart()
  const { includeVat } = useSettings()
  const { data: deliveryCalculations, isLoading: isLoadingDelivery } = useDeliveryCalculation()
  const { data: optimization } = useDeliveryOptimization()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderApproved, setOrderApproved] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const totalItems = getTotalItems()
  const subtotalPrice = getTotalPrice(includeVat)
  const totalDeliveryFees = deliveryCalculations?.reduce((sum, calc) => sum + calc.total_delivery_cost, 0) || 0
  const grandTotal = subtotalPrice + totalDeliveryFees

  const handleOrderApproval = (reason?: string) => {
    setOrderApproved(true)
    toast({
      title: "Order Approved",
      description: reason || "Order approved for checkout despite delivery costs.",
    })
  }

  const handleOrderRejection = (reason: string) => {
    toast({
      title: "Order Rejected",
      description: reason,
      variant: "destructive"
    })
  }

  const handleCheckout = async () => {
    setIsSubmitting(true)
    try {
      // Here you would implement actual checkout logic
      toast({
        title: "Order Submitted",
        description: "Your order has been submitted successfully.",
      })
      clearCart()
      setOrderApproved(false)
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: "There was an error submitting your order.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground text-center">
            <p className="text-lg mb-2">Your cart is empty</p>
            <p className="text-sm">Add items from the product comparison to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group items by supplier
  const supplierGroups = items.reduce((groups, item) => {
    if (!groups[item.supplierId]) {
      groups[item.supplierId] = {
        supplierName: item.supplierName,
        items: []
      }
    }
    groups[item.supplierId].items.push(item)
    return groups
  }, {} as Record<string, { supplierName: string; items: typeof items }>)

  return (
    <div className="space-y-6">
      {/* Delivery Optimization Banner */}
      {optimization && (
        <DeliveryOptimizationBanner optimization={optimization} />
      )}

      {/* Order Approval Workflow */}
      {deliveryCalculations && !orderApproved && (
        <OrderApprovalWorkflow
          calculations={deliveryCalculations}
          onApprove={handleOrderApproval}
          onReject={handleOrderRejection}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Order Items by Supplier */}
      {Object.entries(supplierGroups).map(([supplierId, group]) => {
        const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
        const supplierSubtotal = group.items.reduce((sum, item) => {
          const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
          return sum + (price * item.quantity)
        }, 0)

        return (
          <Card key={supplierId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.supplierName}</CardTitle>
                <div className="flex items-center gap-2">
                  {supplierDelivery && (
                    <DeliveryFeeIndicator calculation={supplierDelivery} />
                  )}
                  {supplierDelivery?.next_delivery_day && (
                    <Badge variant="outline" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Next: {supplierDelivery.next_delivery_day}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {group.items.map((item) => {
                const itemPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                const lineTotal = itemPrice * item.quantity

                return (
                  <div key={item.supplierItemId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.displayName}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>{item.packSize}</span>
                        <span>•</span>
                        <span>{formatPrice(itemPrice)} per {item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.supplierItemId, Math.max(1, item.quantity - 1))}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.supplierItemId, item.quantity + 1)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <div className="font-medium text-sm">
                          {formatPrice(lineTotal)}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.supplierItemId)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* Supplier Summary */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items subtotal:</span>
                  <span>{formatPrice(supplierSubtotal)}</span>
                </div>
                
                {supplierDelivery && supplierDelivery.total_delivery_cost > 0 && (
                  <>
                    {supplierDelivery.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery fee:</span>
                        <span>{formatPrice(supplierDelivery.delivery_fee)}</span>
                      </div>
                    )}
                    
                    {supplierDelivery.fuel_surcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Fuel surcharge:</span>
                        <span>{formatPrice(supplierDelivery.fuel_surcharge)}</span>
                      </div>
                    )}
                    
                    {supplierDelivery.pallet_deposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Pallet deposit:</span>
                        <span>{formatPrice(supplierDelivery.pallet_deposit)}</span>
                      </div>
                    )}
                  </>
                )}

                {supplierDelivery?.amount_to_free_delivery && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    Add {formatPrice(supplierDelivery.amount_to_free_delivery)} more for free delivery
                  </div>
                )}

                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Supplier total:</span>
                  <span>{formatPrice(supplierSubtotal + (supplierDelivery?.total_delivery_cost || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Items ({totalItems}):</span>
            <span>{formatPrice(subtotalPrice)}</span>
          </div>
          
          {totalDeliveryFees > 0 && (
            <div className="flex justify-between">
              <span>Total delivery fees:</span>
              <span>{formatPrice(totalDeliveryFees)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-semibold">
            <span>Grand total:</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={isSubmitting || (!orderApproved && totalDeliveryFees > 10000)}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={clearCart}
              disabled={isSubmitting}
            >
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
