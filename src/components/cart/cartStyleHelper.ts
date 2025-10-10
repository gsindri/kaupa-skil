import { cn } from '@/lib/utils'

type CartControlVariant = 'catalog' | 'compact'

type CartControlClassMap = {
  stepper: Record<CartControlVariant, string>
}

const cartControlClassMap: CartControlClassMap = {
  stepper: {
    catalog: cn('rounded-full'),
    compact: cn('rounded-full', 'text-[13px]'),
  },
}

export const cartStepperClassNames = cartControlClassMap.stepper

export function getCartStepperClassName(variant: CartControlVariant = 'catalog') {
  return cartControlClassMap.stepper[variant]
}
