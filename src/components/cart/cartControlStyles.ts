import { cn } from '@/lib/utils'

export type CartControlVariant = 'catalog' | 'compact'

export type CartControlClasses = {
  button: string
  disabledButton: string
  passiveButton: string
  unavailableButton: string
  stepper: string
}

export type CartControlClassOverrides = Partial<CartControlClasses>

const buttonBaseClasses =
  'inline-flex w-full items-center justify-center rounded-full text-sm font-medium px-4'
const interactiveButtonClasses =
  'transition-colors duration-150 hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const buttonHeights: Record<CartControlVariant, string> = {
  catalog: 'h-10',
  compact: 'h-9',
}

const stepperBaseClasses = 'rounded-full'
const compactStepperEnhancements = 'text-[13px]'

/**
 * Provides standardized class names for cart controls.
 *
 * @param variant - Chooses between the default catalog height and the compact version.
 * @param overrides - Optional additional classes to append for specific surfaces.
 */
export function getCartControlClasses(
  variant: CartControlVariant = 'catalog',
  overrides: CartControlClassOverrides = {},
): CartControlClasses {
  const heightClass = buttonHeights[variant]

  return {
    button: cn(
      buttonBaseClasses,
      'bg-secondary text-secondary-foreground shadow-sm',
      interactiveButtonClasses,
      heightClass,
      overrides.button,
    ),
    disabledButton: cn(
      buttonBaseClasses,
      'bg-muted text-muted-foreground shadow-none',
      heightClass,
      overrides.disabledButton,
    ),
    passiveButton: cn(
      buttonBaseClasses,
      'border border-border/70 bg-background/80 text-muted-foreground shadow-none backdrop-blur-sm',
      heightClass,
      overrides.passiveButton,
    ),
    unavailableButton: cn(
      buttonBaseClasses,
      'border border-dashed border-muted-foreground/60 bg-background/70 text-muted-foreground shadow-none',
      heightClass,
      overrides.unavailableButton,
    ),
    stepper: cn(
      stepperBaseClasses,
      variant === 'compact' && compactStepperEnhancements,
      overrides.stepper,
    ),
  }
}

export function getCompactCartControlClasses(overrides?: CartControlClassOverrides) {
  return getCartControlClasses('compact', overrides)
}

