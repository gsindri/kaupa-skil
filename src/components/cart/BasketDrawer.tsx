
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
import { useCart } from '@/contexts/CartProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { toast } from '@/hooks/use-toast'

export function BasketDrawer() {
  const { items, getTotalItems, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem } = useCart()
  const { includeVat } = useSettings()

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

  const totalExVat = Object.values(supplierGroups).reduce((sum: number, group: any) => sum + group.subtotalExVat, 0)
  const totalIncVat = Object.values(supplierGroups).reduce((sum: number, group: any) => sum + group.subtotalIncVat, 0)

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
              {/* Per-supplier splits */}
              {Object.entries(supplierGroups).map(([supplierId, group]: [string, any]) => (
                <Card key={supplierId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{group.supplier}</CardTitle>
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
                    
                    <div className="flex justify-between font-medium">
                      <span>Subtotal ({includeVat ? 'inc VAT' : 'ex VAT'})</span>
                      <span className="font-mono">
                        {formatPrice(includeVat ? group.subtotalIncVat : group.subtotalExVat)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Delivery notes: Standard delivery</div>
                      <div>Cutoff: Tomorrow 14:00</div>
                    </div>
                  </CardContent>
                </Card>
              ))}

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

              {/* Totals */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total ex VAT</span>
                    <span className="font-mono">{formatPrice(totalExVat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total inc VAT</span>
                    <span className="font-mono">{formatPrice(totalIncVat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total ({includeVat ? 'inc VAT' : 'ex VAT'})</span>
                    <span className="font-mono">
                      {formatPrice(includeVat ? totalIncVat : totalExVat)}
                    </span>
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
