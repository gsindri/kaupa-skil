import React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Send, CheckCircle, Save } from 'lucide-react'
import { useCart } from '@/contexts/BasketProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { useDeliveryCalculation } from '@/hooks/useDeliveryOptimization'
import { DeliveryHints } from './DeliveryHints'
import { toast } from '@/hooks/use-toast'

export function BasketDrawer() {
  const { items, getTotalItems, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem } = useCart()
  const { includeVat } = useSettings()
  const { data: deliveryCalculations = [], isLoading: deliveryLoading } = useDeliveryCalculation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Group items by supplier
  const supplierGroups = items.reduce((groups, item) => {
    const supplierId = item.supplierId
    if (!groups[supplierId]) {
      groups[supplierId] = {
        supplier: item.supplierName,
        items: [],
        subtotalExVat: 0,
        subtotalIncVat: 0
      }
    }
    groups[supplierId].items.push(item)
    groups[supplierId].subtotalExVat += item.unitPriceExVat * item.quantity
    groups[supplierId].subtotalIncVat += item.unitPriceIncVat * item.quantity
    return groups
  }, {} as Record<string, any>)

  // Calculate delivery hints
  const deliveryHints = deliveryCalculations
    .filter(calc => calc.is_under_threshold && calc.amount_to_free_delivery)
    .map(calc => ({
      supplierId: calc.supplier_id,
      supplierName: calc.supplier_name,
      amountToFreeDelivery: calc.amount_to_free_delivery!,
      currentDeliveryFee: calc.delivery_fee,
      suggestedItems: [
        { id: 'staple-1', name: 'Flour 1kg', packSize: '1kg', unitPrice: 200 },
        { id: 'staple-2', name: 'Sugar 500g', packSize: '500g', unitPrice: 150 },
        { id: 'staple-3', name: 'Salt 500g', packSize: '500g', unitPrice: 100 }
      ]
    }))

  const totalExVat = Object.values(supplierGroups).reduce((sum: number, group: any) => sum + group.subtotalExVat, 0)
  const totalIncVat = Object.values(supplierGroups).reduce((sum: number, group: any) => sum + group.subtotalIncVat, 0)
  const totalDeliveryFees = deliveryCalculations.reduce((sum, calc) => sum + calc.total_delivery_cost, 0)
  const grandTotal = (includeVat ? totalIncVat : totalExVat) + totalDeliveryFees

  const needsApproval = totalExVat > 200000 // Mock approval threshold

  const handleSendAll = () => {
    if (needsApproval) {
      toast({
        title: 'Approval required',
        description: 'Order exceeds approval limit. Please send for approval.',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Orders sent',
      description: `${Object.keys(supplierGroups).length} orders have been dispatched to suppliers`
    })
    setIsDrawerOpen(false)
  }

  const handleSendForApproval = () => {
    toast({
      title: 'Sent for approval',
      description: 'Order has been submitted for approval'
    })
    setIsDrawerOpen(false)
  }

  const handleSaveDraft = () => {
    toast({
      title: 'Draft saved',
      description: 'Your order has been saved as a draft'
    })
  }

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerContent className="max-w-2xl ml-auto h-full">
        <DrawerHeader>
          <DrawerTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Your Order ({getTotalItems()} items)
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4 overflow-y-auto flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Your basket is empty
            </div>
          ) : (
            <>
              {/* Delivery optimization hints */}
              <DeliveryHints hints={deliveryHints} />

              {/* Per-supplier splits */}
              {Object.entries(supplierGroups).map(([supplierId, group]: [string, any]) => {
                const supplierDelivery = deliveryCalculations.find(calc => calc.supplier_id === supplierId)
                
                return (
                  <Card key={supplierId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{group.supplier}</span>
                        {supplierDelivery?.next_delivery_day && (
                          <Badge variant="outline" className="text-xs">
                            Next: {supplierDelivery.next_delivery_day}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {group.items.map((item: any) => (
                        <div key={item.supplierItemId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.packSize} • SKU: {item.sku}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.quantity}x</span>
                            <span className="font-mono">
                              {formatPrice(includeVat ? item.unitPriceIncVat : item.unitPriceExVat)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal ({includeVat ? 'inc VAT' : 'ex VAT'})</span>
                          <span className="font-mono">
                            {formatPrice(includeVat ? group.subtotalIncVat : group.subtotalExVat)}
                          </span>
                        </div>
                        
                        {supplierDelivery && supplierDelivery.total_delivery_cost > 0 && (
                          <div className="flex justify-between text-sm text-orange-600">
                            <span>Delivery & fees</span>
                            <span className="font-mono">
                              {formatPrice(supplierDelivery.total_delivery_cost)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Supplier total</span>
                          <span className="font-mono">
                            {formatPrice((includeVat ? group.subtotalIncVat : group.subtotalExVat) + (supplierDelivery?.total_delivery_cost || 0))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Needs approval banner */}
              {needsApproval && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Approval Required</span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Order total exceeds approval limit of {formatPrice(200000)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Grand totals */}
              <Card className="bg-slate-50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Items total ({includeVat ? 'inc VAT' : 'ex VAT'})</span>
                    <span className="font-mono">{formatPrice(includeVat ? totalIncVat : totalExVat)}</span>
                  </div>
                  {totalDeliveryFees > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Total delivery & fees</span>
                      <span className="font-mono">{formatPrice(totalDeliveryFees)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span className="font-mono">{formatPrice(grandTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleSaveDraft} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                
                {needsApproval ? (
                  <Button onClick={handleSendForApproval} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Send for Approval
                  </Button>
                ) : (
                  <Button onClick={handleSendAll} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Send All
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
