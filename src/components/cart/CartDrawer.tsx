
import React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartProvider'
import { OrderComposer } from '@/components/orders/OrderComposer'

export function CartDrawer() {
  const { getTotalItems, isDrawerOpen, setIsDrawerOpen } = useCart()
  const itemCount = getTotalItems()

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {itemCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-2xl ml-auto h-full">
        <DrawerHeader>
          <DrawerTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Your Order ({itemCount} items)
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1">
          <OrderComposer />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
