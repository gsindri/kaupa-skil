
import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Info } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { useSettings } from '@/contexts/SettingsProvider'
import { useCart } from '@/contexts/CartProvider'
import type { SupplierQuote } from '@/lib/types'

interface ComparisonTableRowProps {
  supplier: SupplierQuote & {
    itemName: string
    brand?: string
    cartQuantity: number
  }
  onQuantityChange: (supplierItemId: string, quantity: number) => void
}

export function ComparisonTableRow({ supplier, onQuantityChange }: ComparisonTableRowProps) {
  const { includeVat } = useSettings()
  const { items: cartItems } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const price = includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat
  const packPrice = includeVat ? supplier.packPrice * 1.24 : supplier.packPrice

  return (
    <TableRow className={supplier.cartQuantity > 0 ? 'bg-blue-50' : ''}>
      <TableCell className="sticky left-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{supplier.name}</div>
            <div className="text-xs text-muted-foreground">
              SKU: {supplier.sku}
            </div>
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
            onClick={() => onQuantityChange(
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
            onChange={(e) => onQuantityChange(
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
            onClick={() => onQuantityChange(
              supplier.supplierItemId,
              supplier.cartQuantity + 1
            )}
            disabled={!supplier.inStock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button size="sm" variant="ghost">
          <Info className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
