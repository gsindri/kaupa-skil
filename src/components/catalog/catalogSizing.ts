import type { CSSProperties } from 'react'

export type CatalogAddToCartSize = 'sm' | 'md' | 'lg'

type SizeTokenRecord = Record<string, string>

const createTokens = (tokens: SizeTokenRecord): CSSProperties => tokens

export const CATALOG_ADD_TO_CART_SIZE_TOKENS: Record<
  CatalogAddToCartSize,
  CSSProperties
> = {
  sm: createTokens({
    '--atc-h': '2.25rem',
    '--atc-radius': '9999px',
    '--atc-pad-x': '0.75rem',
    '--atc-icon': '1.125rem',
    '--atc-gap': '0.5rem',
    '--atc-font-size': '0.875rem',
    '--atc-min-w': '7.5rem',
    '--atc-count-min': 'calc(var(--atc-h) * 1.3)',
    '--atc-stepper-pad': 'calc(var(--atc-pad-x) * 0.7)',
  }),
  md: createTokens({
    '--atc-h': '2.5rem',
    '--atc-radius': '9999px',
    '--atc-pad-x': '1rem',
    '--atc-icon': '1.25rem',
    '--atc-gap': '0.625rem',
    '--atc-font-size': '0.95rem',
    '--atc-min-w': '8.25rem',
    '--atc-count-min': 'calc(var(--atc-h) * 1.3)',
    '--atc-stepper-pad': 'calc(var(--atc-pad-x) * 0.7)',
  }),
  lg: createTokens({
    '--atc-h': '2.625rem',
    '--atc-radius': '9999px',
    '--atc-pad-x': '1.125rem',
    '--atc-icon': '1.375rem',
    '--atc-gap': '0.75rem',
    '--atc-font-size': '1rem',
    '--atc-min-w': '8.5rem',
    '--atc-count-min': 'calc(var(--atc-h) * 1.32)',
    '--atc-stepper-pad': 'calc(var(--atc-pad-x) * 0.68)',
  }),
}

export const getAddToCartSizeTokens = (
  size: CatalogAddToCartSize,
): CSSProperties => ({ ...CATALOG_ADD_TO_CART_SIZE_TOKENS[size] })

