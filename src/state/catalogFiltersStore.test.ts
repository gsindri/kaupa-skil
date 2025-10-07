import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFiltersStore'

describe('catalogFilters store', () => {
  it('updates filters, sort and boolean toggles', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    expect(result.current.filters.brand).toEqual(['Foo'])
    act(() => result.current.setSort('az'))
    expect(result.current.sort).toBe('az')
    act(() => result.current.setInStock(true))
    expect(result.current.inStock).toBe(true)
    act(() => result.current.setOnSpecial(true))
    expect(result.current.onSpecial).toBe(true)
    act(() => result.current.setMySuppliers(true))
    expect(result.current.mySuppliers).toBe(true)
  })

  it('clears to default state', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    act(() => result.current.setOnlyWithPrice(true))
    act(() => result.current.setSort('az'))
    act(() => result.current.setInStock(true))
    act(() => result.current.setOnSpecial(true))
    act(() => result.current.setMySuppliers(true))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({
      filters: {},
      onlyWithPrice: false,
      inStock: false,
      onSpecial: false,
      mySuppliers: false,
      sort: 'relevance',
    })
  })
})

