import { describe, it, expect } from 'vitest'
import { cleanAvailabilityText, availabilityStatusFromText } from './availability'

describe('availability text utilities', () => {
  it('normalizes and classifies out-of-stock text', () => {
    const raw = `  <span>Ekki</span> til  á
    lager  `
    const cleaned = cleanAvailabilityText(raw)
    expect(cleaned).toBe('ekki til á lager')
    expect(availabilityStatusFromText(raw)).toBe('OUT_OF_STOCK')
  })
})

