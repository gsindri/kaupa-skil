import { useMemo, type ReactNode } from 'react'
import { CatalogAddToCartButton, type CatalogAddToCartSupplier } from '@/components/catalog/CatalogAddToCartButton'
import { CatalogQuantityStepper } from '@/components/catalog/CatalogQuantityStepper'
import { getCartControlClasses } from '@/components/cart/cartControlStyles'
import type { AddItemOptions } from '@/contexts/useCartQuantityController'

interface UnifiedCartControlProps {
  product: any
  suppliers?: CatalogAddToCartSupplier[]
  variant?: 'catalog' | 'compact'
  className?: string
  buttonLabel?: ReactNode
  addItemOptions?: AddItemOptions
  onActionButtonRef?: (node: HTMLButtonElement | null) => void
  isLoading?: boolean
  onAdd?: (supplierId: string) => void
  popoverSide?: 'top' | 'bottom' | 'left' | 'right'
  popoverAlign?: 'start' | 'end' | 'center'
}

/**
 * Unified cart control component that provides consistent styling
 * for add-to-cart buttons and quantity steppers across the application.
 * 
 * @param variant - 'catalog' (default, 40px height) or 'compact' (36px height)
 */
export function UnifiedCartControl({
  product,
  suppliers,
  variant = 'catalog',
  className,
  buttonLabel = 'Add',
  addItemOptions,
  onActionButtonRef,
  isLoading,
  onAdd,
  popoverSide = 'top',
  popoverAlign = 'end',
}: UnifiedCartControlProps) {
  const isCatalog = variant === 'catalog'

  const { button, disabledButton, passiveButton, unavailableButton, stepper } = useMemo(
    () => getCartControlClasses(variant),
    [variant],
  )

  return (
    <CatalogAddToCartButton
      product={product}
      suppliers={suppliers}
      className={className}
      buttonClassName={button}
      disabledButtonClassName={disabledButton}
      passiveButtonClassName={passiveButton}
      unavailableButtonClassName={unavailableButton}
      stepperClassName={stepper}
      buttonLabel={buttonLabel}
      addItemOptions={addItemOptions}
      onActionButtonRef={onActionButtonRef}
      isLoading={isLoading}
      onAdd={onAdd}
      popoverSide={popoverSide}
      popoverAlign={popoverAlign}
      size={isCatalog ? 'md' : 'sm'}
      renderStepper={({
        controller,
        currentQuantity,
        handleQuantityChange,
        handleRemove,
        maxQuantity,
        product,
        primarySupplierName,
      }) => {
        return (
          <CatalogQuantityStepper
            quantity={currentQuantity}
            onChange={handleQuantityChange}
            onRemove={handleRemove}
            itemLabel={`${product.name} from ${primarySupplierName}`}
            className={stepper}
            size={isCatalog ? 'md' : 'sm'}
            canIncrease={controller.canIncrease}
            maxQuantity={maxQuantity}
            minQuantity={0}
          />
        )
      }}
    />
  )
}

export default UnifiedCartControl
