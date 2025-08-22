import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { lockBody, unlockBody } from '../lockBody'

describe('lockBody', () => {
  beforeEach(() => {
    document.body.style.cssText = ''
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    ;(window as any).scrollTo = vi.fn()
  })

  afterEach(() => {
    // Ensure no leftover locks even if a test fails
    for (let i = 0; i < 10; i++) unlockBody()
    document.body.style.cssText = ''
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    vi.restoreAllMocks()
  })

  it('locks body using fixed positioning', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 })
    lockBody()
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-120px')
    unlockBody()
  })

  it('restores styles and scroll position when unlocked', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 80 })
    lockBody()
    unlockBody()
    expect(document.body.style.position).toBe('')
    expect((window.scrollTo as any)).toHaveBeenCalledWith(0, 80)
  })
})

