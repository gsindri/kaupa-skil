
import React, { useState, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Minus, Info, ExternalLink, AlertTriangle } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { DeliveryFeeIndicator } from '@/components/delivery/DeliveryFeeIndicator'
import type { ComparisonItem, CartItem } from '@/lib/types'
import type { DeliveryCalculation } from '@/lib/types/delivery'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'

interface EnhancedComparisonTableProps {
  data: ComparisonItem[]
  isLoading?: boolean
}

export async function calculateLandedCostForSupplier(
  supplier: any,
  quantity: number,
  cache: Map<string, DeliveryCalculation>,
  setCache: React.Dispatch<
    React.SetStateAction<Map<string, DeliveryCalculation>>
  >
): Promise<number> {
  const cached = cache.get(supplier.supplierItemId)
  if (cached) {
    return cached.landed_cost
  }

  const mockCartItem: CartItem = {
    id: supplier.id,
    supplierItemId: supplier.supplierItemId,
    supplierId: supplier.id,
    supplierName: supplier.name,
    itemName: supplier.name,
    sku: supplier.sku,
    packSize: supplier.packSize,
    packPrice: supplier.packPrice,
    unitPriceExVat: supplier.unitPriceExVat,
    unitPriceIncVat: supplier.unitPriceIncVat,
    vatRate: 0.24,
    unit: supplier.unit,
    displayName: supplier.name,
    packQty: 1,
    quantity
  }

  try {
    const { deliveryCalculator } = await import(
      '@/services/DeliveryCalculator'
    )
    const calculation = await deliveryCalculator.calculateDeliveryForSupplier(
      supplier.id,
      supplier.name,
      [mockCartItem]
    )
    setCache(prev => {
      const updated = new Map(prev)
      updated.set(supplier.supplierItemId, calculation)
      return updated
    })
    return calculation.landed_cost
  } catch (error) {
    console.error('Failed to calculate delivery:', error)
    return supplier.unitPriceExVat * quantity
  }
}

export function EnhancedComparisonTable({ data, isLoading }: EnhancedComparisonTableProps) {
  const { includeVat } = useSettings()
  const { addItem, updateQuantity, items: cartItems } = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [deliveryCalculations, setDeliveryCalculations] = useState<
    Map<string, DeliveryCalculation>
  >(new Map())

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getCartQuantity = useCallback((supplierItemId: string) => {
    const cartItem = cartItems.find(item => item.supplierItemId === supplierItemId)
    return cartItem?.quantity || 0
  }, [cartItems])

  const calculateLandedCost = useCallback(
    (supplier: any, quantity: number) =>
      calculateLandedCostForSupplier(
        supplier,
        quantity,
        deliveryCalculations,
        setDeliveryCalculations
      ),
    [deliveryCalculations]
  )

  const handleQuantityChange = async (supplierItemId: string, newQuantity: number) => {
    const currentCartQuantity = getCartQuantity(supplierItemId)
    
    if (newQuantity > currentCartQuantity) {
      const supplierQuote = data.flatMap(item => 
        item.suppliers.map(supplier => ({
          ...supplier,
          itemName: item.itemName,
          brand: item.brand || ''
        }))
      ).find(supplier => supplier.supplierItemId === supplierItemId)

      if (supplierQuote) {
        // Check if this would create a new supplier with delivery fee
        const isNewSupplier = !cartItems.some(item => item.supplierId === supplierQuote.id)
        
        if (isNewSupplier) {
          await calculateLandedCost(supplierQuote, newQuantity - currentCartQuantity)
        }

        const cartItem: Omit<CartItem, 'quantity'> = {
          id: supplierQuote.id,
          supplierItemId: supplierQuote.supplierItemId,
          supplierId: supplierQuote.id,
          supplierName: supplierQuote.name,
          itemName: supplierQuote.itemName,
          sku: supplierQuote.sku,
          packSize: supplierQuote.packSize,
          packPrice: supplierQuote.packPrice,
          unitPriceExVat: supplierQuote.unitPriceExVat,
          unitPriceIncVat: supplierQuote.unitPriceIncVat,
          vatRate: 0.24,
          unit: supplierQuote.unit,
          displayName: supplierQuote.itemName,
          packQty: 1
        }
        
        addItem(cartItem, newQuantity - currentCartQuantity)
      }
    } else if (newQuantity < currentCartQuantity) {
      updateQuantity(supplierItemId, newQuantity)
    }
  }

  const expandedItems = useMemo(() => {
    return data.map(item => ({
      ...item,
      suppliers: item.suppliers.map(supplier => ({
        ...supplier,
        isInCart: getCartQuantity(supplier.supplierItemId) > 0,
        cartQuantity: getCartQuantity(supplier.supplierItemId)
      }))
    }))
  }, [data, getCartQuantity])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items found matching your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {expandedItems.map((item) => (
        <div key={item.id} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{item.itemName}</h3>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {item.brand && <span>Brand: {item.brand}</span>}
                  {item.category && <span>• Category: {item.category}</span>}
                </div>
              </div>
              <Badge variant="secondary">
                {item.suppliers.length} supplier{item.suppliers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Supplier</TableHead>
                  <TableHead>Pack Size</TableHead>
                  <TableHead className="text-right">Price/Pack</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Landed Cost</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">History</TableHead>
                  <TableHead className="text-center min-w-[120px]">Quantity</TableHead>
                  <TableHead className="text-center">Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.suppliers.map((supplier) => {
                  const price = includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat
                  const packPrice = includeVat ? supplier.packPrice * 1.24 : supplier.packPrice
                  const deliveryCalc = deliveryCalculations.get(supplier.supplierItemId)
                  const isNewSupplier = !cartItems.some(item => item.supplierId === supplier.id)
                  
                  return (
                    <TableRow key={supplier.supplierItemId} className={supplier.isInCart ? 'bg-blue-50' : ''}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {supplier.sku}
                            </div>
                            {isNewSupplier && deliveryCalc && deliveryCalc.total_delivery_cost > 0 && (
                              <div className="mt-1">
                                <DeliveryFeeIndicator calculation={deliveryCalc} />
                              </div>
                            )}
                          </div>
                          {supplier.badge && (
                            <Badge
                              variant={supplier.badge === 'best' ? 'default' : 
                                     supplier.badge === 'good' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {supplier.badge === 'best' ? 'Best price' : 
                               supplier.badge === 'good' ? 'Good price' : 'Expensive'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.packSize}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPrice(packPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-medium">
                        {formatPrice(price)}
                        <div className="text-xs text-muted-foreground">
                          per {supplier.unit}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {deliveryCalc ? (
                          <div>
                            <div className="font-medium">{formatPrice(deliveryCalc.landed_cost / supplier.cartQuantity || 1)}</div>
                            {deliveryCalc.total_delivery_cost > 0 && (
                              <div className="text-xs text-orange-600">
                                +{formatPrice(deliveryCalc.total_delivery_cost)} delivery
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium">{formatPrice(price)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={supplier.inStock ? 'default' : 'secondary'}>
                          {supplier.inStock ? 'In stock' : 'Out of stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Sparkline 
                          data={supplier.priceHistory} 
                          width={60} 
                          height={20}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(
                              supplier.supplierItemId, 
                              Math.max(0, supplier.cartQuantity - 1)
                            )}
                            disabled={!supplier.inStock || supplier.cartQuantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={supplier.cartQuantity}
                            onChange={(e) => handleQuantityChange(
                              supplier.supplierItemId,
                              parseInt(e.target.value) || 0
                            )}
                            className="w-12 h-8 text-center text-xs px-1"
                            min="0"
                            disabled={!supplier.inStock}
                          />
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(
                              supplier.supplierItemId,
                              supplier.cartQuantity + 1
                            )}
                            disabled={!supplier.inStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {isNewSupplier && deliveryCalc && deliveryCalc.total_delivery_cost > 0 && (
                          <div className="mt-1 flex items-center justify-center">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="ghost">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
