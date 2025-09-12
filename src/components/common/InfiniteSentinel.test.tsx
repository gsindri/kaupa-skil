import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InfiniteSentinel } from './InfiniteSentinel'

describe('InfiniteSentinel', () => {
  let callback: any
  const observe = vi.fn()
  const disconnect = vi.fn()

  class MockIntersectionObserver {
    constructor(cb: any) {
      callback = cb
    }
    observe = observe
    unobserve = disconnect
    disconnect = disconnect
  }

  beforeEach(() => {
    observe.mockClear()
    disconnect.mockClear()
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as any)
  })

  it('invokes onVisible when becoming visible', () => {
    const onVisible = vi.fn()
    render(<InfiniteSentinel onVisible={onVisible} />)
    expect(observe).toHaveBeenCalled()
    callback([{ isIntersecting: true }])
    expect(onVisible).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalled()
  })
})
