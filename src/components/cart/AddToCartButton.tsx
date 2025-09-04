import { Button } from '@/components/ui/button'
import { QuantityStepper } from './QuantityStepper'
import { useCart } from '@/contexts/useBasket'

interface AddToCartButtonProps {
  product: any
  vendors: { id: string; name: string }[]
}

export default function AddToCartButton({ product, vendors }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find(i => i.supplierItemId === product.catalog_id)

  if (cartItem) {
    return (
      <QuantityStepper
        quantity={cartItem.quantity}
        onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
        label={product.name}
      />
    )
  }

  const vendorId = vendors[0]?.id || (product.suppliers?.[0]?.id as string | undefined)

  const handleAdd = () => {
    if (!vendorId) return
    addItem({ product_id: product.catalog_id, supplier_id: vendorId })
  }

  return (
    <Button size="sm" onClick={handleAdd} aria-label={`Add ${product.name}`}>
      Add
    </Button>
  )
}

