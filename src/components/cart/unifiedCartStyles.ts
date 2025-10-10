import { cn } from '@/lib/utils'

type UnifiedCartVariant = 'catalog' | 'compact'

interface UnifiedCartClasses {
  button: string
  disabledButton: string
  passiveButton: string
  unavailableButton: string
  stepper: string
}

/**
 * Provides standardized class names for cart controls to ensure
 * consistent styling across catalog and compact contexts.
 */
export function getUnifiedCartClasses(variant: UnifiedCartVariant = 'catalog'): UnifiedCartClasses {
  const isCatalog = variant === 'catalog'
  const heightClass = isCatalog ? 'h-10' : 'h-9'
  const sharedButtonClasses = 'inline-flex w-full items-center justify-center rounded-full'
  const sharedTypographyClasses = 'text-sm font-medium px-4'

  return {
    button: cn(
      sharedButtonClasses,
      'bg-secondary text-secondary-foreground shadow-sm',
      'transition-colors duration-150',
      'hover:bg-secondary/85',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      sharedTypographyClasses,
      heightClass,
    ),
    disabledButton: cn(
      sharedButtonClasses,
      'bg-muted text-muted-foreground shadow-none',
      sharedTypographyClasses,
      heightClass,
    ),
    passiveButton: cn(
      sharedButtonClasses,
      'border border-border/70 bg-background/80 text-muted-foreground',
      'shadow-none backdrop-blur-sm',
      sharedTypographyClasses,
      heightClass,
    ),
    unavailableButton: cn(
      sharedButtonClasses,
      'border border-dashed border-muted-foreground/60',
      'bg-background/70 text-muted-foreground shadow-none',
      sharedTypographyClasses,
      heightClass,
    ),
    stepper: cn('rounded-full', !isCatalog && 'text-[13px]'),
  }
}
