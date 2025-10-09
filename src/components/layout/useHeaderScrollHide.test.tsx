import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { useRef, useLayoutEffect } from 'react'
import { render } from '@testing-library/react'
import useHeaderScrollHide from './useHeaderScrollHide'

class RO {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.useFakeTimers()
  ;(global as any).ResizeObserver = RO as any
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
  })
})

afterEach(() => {
  vi.useRealTimers()
})

function TestComponent({ isPinned }: { isPinned?: () => boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (ref.current) {
      ;(ref.current as any).getBoundingClientRect = () => ({ height: 56 })
    }
  }, [])
  useHeaderScrollHide(ref, { isPinned })
  return <div ref={ref}></div>
}

describe('useHeaderScrollHide', () => {
  const setScroll = (value: number) => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value
    })
  }

  const getHiddenProgress = () =>
    parseFloat(document.documentElement.style.getPropertyValue('--header-hidden') || '0')

  const flush = () => {
    vi.runAllTimers()
  }

  it('tracks hide progress based on scroll delta and resets on scroll up', () => {
    const { container } = render(<TestComponent />)
    const header = container.firstChild as HTMLDivElement
    flush()

    expect(header.style.transform).toBe(
      'translate3d(0, calc(-1 * var(--header-hidden) * var(--header-h)), 0)'
    )
    expect(getHiddenProgress()).toBe(0)

    setScroll(28)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBeCloseTo(0.5, 5)

    setScroll(56)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBeCloseTo(1, 5)

    setScroll(120)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBe(1)

    setScroll(20)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBe(0)
  })

  it('clears progress when scroll direction reverses', () => {
    render(<TestComponent />)
    flush()

    setScroll(30)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBeGreaterThan(0)

    setScroll(10)
    window.dispatchEvent(new Event('scroll'))
    flush()
    expect(getHiddenProgress()).toBe(0)
  })

  it('stays visible when pinned', () => {
    const isPinned = vi.fn().mockReturnValue(true)
    render(<TestComponent isPinned={isPinned} />)
    flush()

    setScroll(100)
    window.dispatchEvent(new Event('scroll'))
    flush()

    expect(getHiddenProgress()).toBe(0)
  })
})
