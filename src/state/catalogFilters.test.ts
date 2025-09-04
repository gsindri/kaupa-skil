import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFilters'

describe('catalogFilters store', () => {
  it('updates filters and sort', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: 'Foo' }))
    expect(result.current.filters.brand).toBe('Foo')
    act(() => result.current.setSort('az'))
    expect(result.current.sort).toBe('az')
  })

  it('clears to default state', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: 'Foo' }))
    act(() => result.current.setOnlyWithPrice(true))
    act(() => result.current.setSort('az'))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({
      filters: {},
      onlyWithPrice: false,
      sort: 'relevance',
    })
  })
})

