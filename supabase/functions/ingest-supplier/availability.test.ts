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

  it.each([
    ['til á lager', 'IN_STOCK'],
    ['ekki til á lager í dag', 'OUT_OF_STOCK'],
    ['ekki enn til á lager', 'OUT_OF_STOCK'],
  ])('classifies %s as %s', (text, status) => {
    expect(availabilityStatusFromText(text)).toBe(status)
  })
})

