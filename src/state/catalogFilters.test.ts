import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFilters'

describe('catalogFilters store', () => {
  it('updates filters, sort and triStock', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    expect(result.current.filters.brand).toEqual(['Foo'])
    act(() => result.current.setSort('az'))
    expect(result.current.sort).toBe('az')
    act(() => result.current.setTriStock('include'))
    expect(result.current.triStock).toBe('include')
  })

  it('clears to default state', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    act(() => result.current.setOnlyWithPrice(true))
    act(() => result.current.setSort('az'))
    act(() => result.current.setTriStock('include'))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({
      filters: {},
      onlyWithPrice: false,
      triStock: 'off',
      sort: 'relevance',
    })
  })
})

