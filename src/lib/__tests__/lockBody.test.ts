import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { lockBody, unlockBody } from '../lockBody'

describe('lockBody', () => {
  beforeEach(() => {
    document.documentElement.style.overflow = 'scroll'
    document.body.style.paddingRight = ''
  })

  afterEach(() => {
    // Ensure no leftover locks even if a test fails
    for (let i = 0; i < 10; i++) unlockBody()
    document.documentElement.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('locks scrolling on the root element', () => {
    lockBody()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('')
    unlockBody()
  })

  it('restores original overflow when all locks are released', () => {
    lockBody()
    lockBody()
    unlockBody()
    // Still locked because one lock remains
    expect(document.documentElement.style.overflow).toBe('hidden')
    unlockBody()
    // Restored to initial value
    expect(document.documentElement.style.overflow).toBe('scroll')
  })
})

