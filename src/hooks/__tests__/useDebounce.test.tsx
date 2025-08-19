import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  it('updates value after delay', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    rerender({ value: 'updated', delay: 500 })

    // Value should remain the same until the delay has passed
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')

    vi.useRealTimers()
  })

  it('clears timeout on unmount', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { result, rerender, unmount } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    rerender({ value: 'updated', delay: 500 })

    // First clear happens on rerender cleanup
    expect(clearSpy).toHaveBeenCalledTimes(1)

    unmount()

    // Second clear should happen on unmount cleanup
    expect(clearSpy).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')

    clearSpy.mockRestore()
    vi.useRealTimers()
  })
})

