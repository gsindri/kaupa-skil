import { Button } from '@/components/ui/button'
import { QuantityStepper } from './QuantityStepper'
import { useCart } from '@/contexts/useBasket'
import { useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface AddToCartButtonProps {
  product: any
  vendors: { id: string; name: string }[]
}

export default function AddToCartButton({ product, vendors }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const cartItem = items.find(i => i.supplierItemId === product.catalog_id)

  const [vendorId, setVendorId] = useState(
    vendors.length === 1 ? vendors[0].id : (product.suppliers?.[0]?.id as string | undefined)
  )

  if (cartItem) {
    return (
      <QuantityStepper
        quantity={cartItem.quantity}
        onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
        onRemove={() => removeItem(cartItem.supplierItemId)}
        label={product.name}
      />
    )
  }

  const handleAdd = () => {
    if (!vendorId) return
    addItem({ product_id: product.catalog_id, supplier_id: vendorId })
  }

  return (
    <div className="flex items-center gap-2">
      {vendors.length > 1 && (
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger className="w-[140px]" aria-label="Select vendor">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        onClick={handleAdd}
        aria-label={`Add ${product.name}`}
        disabled={!vendorId}
      >
        Add
      </Button>
    </div>
  )
}

