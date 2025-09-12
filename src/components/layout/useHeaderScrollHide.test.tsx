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

function TestComponent() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (ref.current) {
      ;(ref.current as any).getBoundingClientRect = () => ({ height: 56 })
    }
  }, [])
  useHeaderScrollHide(ref)
  return <div ref={ref}></div>
}

describe('useHeaderScrollHide', () => {
  it('updates --hdr-p with scroll hysteresis', () => {
    const { container } = render(<TestComponent />)
    const header = container.firstChild as HTMLDivElement
    vi.runAllTimers()
    expect(header.style.getPropertyValue('--hdr-p')).toBe('0.000')

    Object.defineProperty(window, 'scrollY', { writable: true, value: 200 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.getPropertyValue('--hdr-p')).toBe('1.000')

    vi.advanceTimersByTime(250)
    Object.defineProperty(window, 'scrollY', { writable: true, value: 180 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.getPropertyValue('--hdr-p')).toBe('1.000')

    Object.defineProperty(window, 'scrollY', { writable: true, value: 150 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.getPropertyValue('--hdr-p')).toBe('0.000')
  })
})
