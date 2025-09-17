import { describe, it, expect } from 'vitest'

import { derivePriceChangeMetrics } from '../useRealTimePrices'

describe('derivePriceChangeMetrics', () => {
  it('returns a finite fallback percentage when the previous price is zero', () => {
    const result = derivePriceChangeMetrics(0, 1200)

    expect(result.oldPrice).toBe(0)
    expect(result.newPrice).toBe(1200)
    expect(result.priceChange).toBe(1200)
    expect(result.changePercentage).toBe(100)
  })

  it('returns zero when there is no price change from zero', () => {
    const result = derivePriceChangeMetrics(0, 0)

    expect(result.oldPrice).toBe(0)
    expect(result.newPrice).toBe(0)
    expect(result.priceChange).toBe(0)
    expect(result.changePercentage).toBe(0)
  })
})
