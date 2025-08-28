
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useBasket } from '@/contexts/useBasket'
import { formatPrice } from '@/lib/utils'
import { useSettings } from '@/contexts/useSettings'

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeItem,
    getTotalItems,
    getTotalPrice
  } = useBasket()
  
  const { settings } = useSettings()
  const showVat = settings?.showPricesWithVat ?? true
  
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice(showVat)

  return (
    // CRITICAL FIX: Ensure drawer is positioned as overlay and doesn't reserve space
    <>
      {/* Cart drawer - positioned as overlay */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-lg border-l">
          <DrawerHeader className="flex items-center justify-between p-4 border-b">
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart {totalItems > 0 && <Badge variant="secondary">{totalItems}</Badge>}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerHeader>

          {/* Cart content */}
          <div className="flex-1 overflow-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p>Your cart is empty</p>
                <Link
                  to="/"
                  className="mt-2 text-sm text-primary hover:underline"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Fragment key={item.supplierItemId}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-1">
                          {item.itemName}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.packSize}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.supplierItemId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.supplierItemId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {formatPrice(
                                (showVat ? item.unitPriceIncVat : item.unitPriceExVat) * item.quantity
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeItem(item.supplierItemId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </Fragment>
                ))}

                <div className="pt-4">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total ({totalItems} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  
                  <Button className="w-full mt-4" size="lg">
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
