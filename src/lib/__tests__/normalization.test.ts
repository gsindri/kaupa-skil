import { describe, it, expect } from 'vitest'
import { normalizeUnit } from '../normalization'

describe('normalizeUnit', () => {
  it('converts kilograms to grams', () => {
    expect(normalizeUnit('5kg')).toEqual({ amount: 5000, unit: 'g' })
  })

  it('keeps grams as grams', () => {
    expect(normalizeUnit('5000g')).toEqual({ amount: 5000, unit: 'g' })
  })
})
