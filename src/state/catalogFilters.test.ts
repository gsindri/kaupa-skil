import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFilters'

describe('useCatalogFilters', () => {
  it('removes filter keys when set to undefined', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => {
      result.current.setFilters({ category: 'foo' })
    })
    expect(result.current.filters).toEqual({ category: 'foo' })
    act(() => {
      result.current.setFilters({ category: undefined })
    })
    expect(result.current.filters).toEqual({})
  })
})
