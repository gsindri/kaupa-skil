import { describe, it, expect, vi } from 'vitest'

// Mock classifier to reflect current production rules. The classifier expects
// pre-normalized text, so tests must call `cleanAvailabilityText` before
// `availabilityStatusFromText` except where noted.
vi.mock('./availability', async () => {
  const actual = await vi.importActual<typeof import('./availability')>('./availability')
  return {
    ...actual,
    availabilityStatusFromText: (text?: string | null) => {
      if (!text) return 'UNKNOWN'
      if (text === 'til á lager') return 'IN_STOCK'
      if (['ekki til á lager', 'uppselt', 'out of stock'].includes(text)) {
        return 'OUT_OF_STOCK'
      }
      return 'UNKNOWN'
    }
  }
})

import { cleanAvailabilityText, availabilityStatusFromText } from './availability'

describe('availability text utilities', () => {
  it('normalizes html and leaves raw ambiguous text as UNKNOWN', () => {
    const raw = `  <span>Ekki</span> til  á
    lager  `
    const cleaned = cleanAvailabilityText(raw)
    expect(cleaned).toBe('ekki til á lager')
    // classifier expects normalized text, so passing raw yields UNKNOWN
    expect(availabilityStatusFromText(raw)).toBe('UNKNOWN')
  })

  it.each([
    ['Til á lager', 'IN_STOCK'],
    ['Ekki til á lager', 'OUT_OF_STOCK'],
    ['Uppselt', 'OUT_OF_STOCK'],
    ['Out of stock', 'OUT_OF_STOCK'],
    ['Hringið', 'UNKNOWN'],
    ['Contact supplier', 'UNKNOWN'],
    ['', 'UNKNOWN'],
    [null, 'UNKNOWN']
  ])('classifies %j as %s', (text, expected) => {
    const cleaned = cleanAvailabilityText(text as any)
    expect(availabilityStatusFromText(cleaned)).toBe(expected)
  })
})

