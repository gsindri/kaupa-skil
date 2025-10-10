import { useMemo, type ReactNode } from 'react'
import { CatalogAddToCartButton, type CatalogAddToCartSupplier } from '@/components/catalog/CatalogAddToCartButton'
import { cn } from '@/lib/utils'
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
  
  // Standardized button styling - rounded-full pill shape with consistent sizing
  const buttonClasses = useMemo(() => cn(
    'inline-flex w-full items-center justify-center rounded-full',
    'bg-secondary text-secondary-foreground shadow-sm',
    'transition-colors duration-150',
    'hover:bg-secondary/85',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'text-sm font-medium px-4',
    isCatalog ? 'h-10' : 'h-9',
  ), [isCatalog])

  // Standardized disabled button styling
  const disabledButtonClasses = useMemo(() => cn(
    'inline-flex w-full items-center justify-center rounded-full',
    'bg-muted text-muted-foreground shadow-none',
    'text-sm font-medium px-4',
    isCatalog ? 'h-10' : 'h-9',
  ), [isCatalog])

  // Standardized passive button styling (notify me, etc.)
  const passiveButtonClasses = useMemo(() => cn(
    'inline-flex w-full items-center justify-center rounded-full',
    'border border-border/70 bg-background/80 text-muted-foreground',
    'shadow-none backdrop-blur-sm',
    'text-sm font-medium px-4',
    isCatalog ? 'h-10' : 'h-9',
  ), [isCatalog])

  // Standardized unavailable button styling
  const unavailableButtonClasses = useMemo(() => cn(
    'inline-flex w-full items-center justify-center rounded-full',
    'border border-dashed border-muted-foreground/60',
    'bg-background/70 text-muted-foreground shadow-none',
    'text-sm font-medium px-4',
    isCatalog ? 'h-10' : 'h-9',
  ), [isCatalog])

  // Standardized stepper styling - matches button height
  const stepperClasses = useMemo(() => cn(
    'rounded-full',
    !isCatalog && 'text-[13px]', // Slightly smaller text for compact variant
  ), [isCatalog])

  return (
    <CatalogAddToCartButton
      product={product}
      suppliers={suppliers}
      className={className}
      buttonClassName={buttonClasses}
      disabledButtonClassName={disabledButtonClasses}
      passiveButtonClassName={passiveButtonClasses}
      unavailableButtonClassName={unavailableButtonClasses}
      stepperClassName={stepperClasses}
      buttonLabel={buttonLabel}
      addItemOptions={addItemOptions}
      onActionButtonRef={onActionButtonRef}
      isLoading={isLoading}
      onAdd={onAdd}
      popoverSide={popoverSide}
      popoverAlign={popoverAlign}
      renderStepper={({
        controller,
        currentQuantity,
        handleQuantityChange,
        handleRemove,
        maxQuantity,
        product,
        primarySupplierName,
      }) => {
        // Import CatalogQuantityStepper dynamically to avoid circular deps
        const { CatalogQuantityStepper } = require('@/components/catalog/CatalogQuantityStepper')
        
        return (
          <CatalogQuantityStepper
            quantity={currentQuantity}
            onChange={handleQuantityChange}
            onRemove={handleRemove}
            itemLabel={`${product.name} from ${primarySupplierName}`}
            className={stepperClasses}
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
