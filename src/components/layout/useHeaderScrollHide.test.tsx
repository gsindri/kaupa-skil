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
  it('hides on scroll down and reveals on scroll up', () => {
    const { container } = render(<TestComponent />)
    const header = container.firstChild as HTMLDivElement
    vi.runAllTimers()
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')
    expect(document.documentElement.style.getPropertyValue('--header-hidden')).toBe('0')

    Object.defineProperty(window, 'scrollY', { writable: true, value: 50 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.transform).toBe('translate3d(0, -100%, 0)')
    expect(document.documentElement.style.getPropertyValue('--header-hidden')).toBe('1')

    vi.advanceTimersByTime(16)
    Object.defineProperty(window, 'scrollY', { writable: true, value: 20 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')
    expect(document.documentElement.style.getPropertyValue('--header-hidden')).toBe('0')
  })

  it('ignores tiny scroll jitters to avoid flicker', () => {
    const { container } = render(<TestComponent />)
    const header = container.firstChild as HTMLDivElement
    vi.runAllTimers()

    Object.defineProperty(window, 'scrollY', { writable: true, value: 8 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')

    Object.defineProperty(window, 'scrollY', { writable: true, value: 25 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()
    expect(header.style.transform).toBe('translate3d(0, -100%, 0)')
  })

  it('responds to sustained small scroll changes', () => {
    const { container } = render(<TestComponent />)
    const header = container.firstChild as HTMLDivElement
    vi.runAllTimers()

    const emitScroll = (value: number) => {
      Object.defineProperty(window, 'scrollY', { writable: true, value })
      window.dispatchEvent(new Event('scroll'))
      vi.runAllTimers()
    }

    emitScroll(0)

    emitScroll(2)
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')

    emitScroll(4)
    emitScroll(6)
    emitScroll(8)
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')

    emitScroll(9)
    expect(header.style.transform).toBe('translate3d(0, -100%, 0)')

    emitScroll(8)
    emitScroll(6)
    emitScroll(2)
    expect(header.style.transform).toBe('translate3d(0, -100%, 0)')

    emitScroll(0)
    expect(header.style.transform).toBe('translate3d(0, 0, 0)')
  })

  it('stays visible when pinned', () => {
    const isPinned = vi.fn().mockReturnValue(true)
    const { container } = render(<TestComponent isPinned={isPinned} />)
    const header = container.firstChild as HTMLDivElement
    vi.runAllTimers()

    Object.defineProperty(window, 'scrollY', { writable: true, value: 100 })
    window.dispatchEvent(new Event('scroll'))
    vi.runAllTimers()

    expect(header.style.transform).toBe('translate3d(0, 0, 0)')
    expect(document.documentElement.style.getPropertyValue('--header-hidden')).toBe('0')
  })
})
