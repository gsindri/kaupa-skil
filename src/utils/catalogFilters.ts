import type { TriState } from '@/state/catalogFiltersStore'

/**
 * Convert a tri-state stock filter into an availability array
 * understood by the backend services.
 */
export function triStockToAvailability(tri: TriState): string[] | undefined {
  switch (tri) {
    case 'include':
      return ['IN_STOCK']
    case 'exclude':
      return ['OUT_OF_STOCK']
    default:
      return undefined
  }
}
