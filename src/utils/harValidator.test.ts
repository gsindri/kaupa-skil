import { describe, expect, it } from 'vitest'
import { HarValidator } from './harValidator'

describe('HarValidator', () => {
  it('flags invalid JSON', () => {
    const validator = new HarValidator()
    const result = validator.validate('not json')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Invalid JSON format')
  })

  it('flags missing JSON responses', () => {
    const validator = new HarValidator()
    const minimalHar = JSON.stringify({ log: { entries: [] } })
    const result = validator.validate(minimalHar)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('No valid JSON responses found in HAR file')
  })
})
