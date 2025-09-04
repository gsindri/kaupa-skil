import { describe, expect, it, vi } from 'vitest'
import { getCachedImageUrl } from '../ImageCache'

describe('getCachedImageUrl', () => {
  it('prefixes relative paths with a slash when CDN base is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getCachedImageUrl('foo/bar.png')).toBe('/foo/bar.png')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns path unchanged if it already starts with a slash', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getCachedImageUrl('/foo/bar.png')).toBe('/foo/bar.png')
    warn.mockRestore()
  })

  it('returns absolute URLs unchanged', () => {
    expect(getCachedImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
  })
})
