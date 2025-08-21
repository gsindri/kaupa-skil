import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { lockBody, unlockBody } from '../lockBody'

const originalGetComputedStyle = window.getComputedStyle
const originalInnerWidth = window.innerWidth
const originalClientWidth = document.documentElement.clientWidth

describe('lockBody', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 100,
    })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 80,
    })
    document.body.style.paddingRight = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: originalClientWidth,
    })
    unlockBody()
    document.body.style.paddingRight = ''
    document.body.style.overflow = ''
  })

  it('adds padding when gutter is not reserved', () => {
    window.getComputedStyle = () =>
      ({ scrollbarGutter: 'auto', overflowY: 'visible' } as any)
    lockBody()
    expect(document.body.style.paddingRight).toBe('20px')
  })

  it('does not add padding when scrollbar gutter is reserved', () => {
    window.getComputedStyle = () =>
      ({ scrollbarGutter: 'stable', overflowY: 'visible' } as any)
    lockBody()
    expect(document.body.style.paddingRight).toBe('')
  })

  it('does not add padding when overflowY is scroll', () => {
    window.getComputedStyle = () =>
      ({ scrollbarGutter: 'auto', overflowY: 'scroll' } as any)
    lockBody()
    expect(document.body.style.paddingRight).toBe('')
  })
})
