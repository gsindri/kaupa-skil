import { describe, it, expect } from 'vitest'
import { cleanAvailabilityText, availabilityStatusFromText } from './availability'

describe('availability text utilities', () => {
  it('normalizes and classifies out-of-stock text', () => {
    const raw = '  <span>Ekki</span> til  á\n lager  '
    const cleaned = cleanAvailabilityText(raw)
    expect(cleaned).toBe('ekki til á lager')
    expect(availabilityStatusFromText(raw)).toBe('OUT_OF_STOCK')
  })

  it('classifies in-stock text', () => {
    const raw = 'Til á lager'
    expect(availabilityStatusFromText(raw)).toBe('IN_STOCK')
  })

  it('classifies low-stock text', () => {
    const raw = 'Lítið til á lager'
    expect(availabilityStatusFromText(raw)).toBe('LOW_STOCK')
  })

  it('returns unknown for other text', () => {
    expect(availabilityStatusFromText('some other status')).toBe('UNKNOWN')
  })
})
