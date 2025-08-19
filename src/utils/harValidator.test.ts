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

  it('accepts a minimal valid HAR with a product API call', () => {
    const validator = new HarValidator()

    const productEntry = {
      startedDateTime: '2024-01-01T00:00:00Z',
      request: { url: 'https://api.example.com/products' },
      response: {
        status: 200,
        content: {
          mimeType: 'application/json',
          text: JSON.stringify({ items: [{ id: 1 }] })
        }
      }
    }

    const otherEntry = (i: number) => ({
      startedDateTime: new Date(1700000000000 + i * 60 * 1000).toISOString(),
      request: { url: `https://example.com/${i}` },
      response: { status: 200, content: { mimeType: 'text/html', text: 'ok' } }
    })

    const har = {
      log: {
        entries: [productEntry, ...Array.from({ length: 4 }, (_, i) => otherEntry(i + 1))]
      }
    }

    const result = validator.validate(JSON.stringify(har))

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.stats.validJsonResponses).toBe(1)
    expect(result.stats.potentialProductApis).toBe(1)
  })

  it('warns about many empty responses', () => {
    const validator = new HarValidator()

    const productEntry = {
      startedDateTime: '2024-01-01T00:00:00Z',
      request: { url: 'https://api.example.com/products' },
      response: {
        status: 200,
        content: {
          mimeType: 'application/json',
          text: JSON.stringify({ items: [{ id: 1 }] })
        }
      }
    }

    const nonEmptyEntry = (i: number) => ({
      startedDateTime: new Date(1700000000000 + i * 60 * 1000).toISOString(),
      request: { url: `https://example.com/${i}` },
      response: { status: 200, content: { mimeType: 'text/html', text: 'ok' } }
    })

    const emptyEntry = (i: number) => ({
      startedDateTime: new Date(1700000000000 + i * 60 * 1000).toISOString(),
      request: { url: `https://example.com/empty/${i}` },
      response: { status: 200, content: { mimeType: 'text/html', text: '' } }
    })

    const entries = [
      productEntry,
      nonEmptyEntry(1),
      nonEmptyEntry(2),
      nonEmptyEntry(3),
      ...Array.from({ length: 6 }, (_, i) => emptyEntry(i + 4))
    ]

    const har = { log: { entries } }

    const result = validator.validate(JSON.stringify(har))

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContain('Many responses appear to be empty')
  })

  it('rejects HAR files that exceed the size limit', () => {
    const validator = new HarValidator()
    const largeHar = 'a'.repeat(50 * 1024 * 1024 + 1)
    const result = validator.validate(largeHar)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('HAR file is too large (max 50MB)')
  })
})
