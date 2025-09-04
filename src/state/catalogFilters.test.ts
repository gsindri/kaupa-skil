import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFilters'

describe('catalogFilters store', () => {
  it('toggles availability values', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.toggleAvailability('in'))
    expect(result.current.availability).toEqual(['in'])
    act(() => result.current.toggleAvailability('in'))
    expect(result.current.availability).toEqual([])
  })

  it('clears to default state', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setSearch('foo'))
    act(() => result.current.toggleAvailability('out'))
    act(() => result.current.setPriceRange(10, 20))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({
      search: '',
      availability: [],
      suppliers: [],
      specials: false,
      mySuppliersOnly: false,
      priceMin: undefined,
      priceMax: undefined,
      sort: { key: 'name', dir: 'asc' },
    })
  })
})

