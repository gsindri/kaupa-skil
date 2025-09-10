import { renderHook, act } from '@testing-library/react'
import { useCatalogFilters } from './catalogFiltersStore'
import { triStockToAvailability } from '@/utils/catalogFilters'

describe('catalogFilters store', () => {
  it('updates filters, sort and tri-state filters', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    expect(result.current.filters.brand).toEqual(['Foo'])
    act(() => result.current.setSort('az'))
    expect(result.current.sort).toBe('az')
    act(() => result.current.setTriStock('include'))
    expect(result.current.triStock).toBe('include')
    act(() => result.current.setTriSpecial('include'))
    expect(result.current.triSpecial).toBe('include')
    act(() => result.current.setTriSuppliers('include'))
    expect(result.current.triSuppliers).toBe('include')
  })

  it('clears to default state', () => {
    const { result } = renderHook(() => useCatalogFilters())
    act(() => result.current.setFilters({ brand: ['Foo'] }))
    act(() => result.current.setOnlyWithPrice(true))
    act(() => result.current.setSort('az'))
    act(() => result.current.setTriStock('include'))
    act(() => result.current.setTriSpecial('include'))
    act(() => result.current.setTriSuppliers('exclude'))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({
      filters: {},
      onlyWithPrice: false,
      triStock: 'off',
      triSpecial: 'off',
      triSuppliers: 'off',
      sort: 'relevance',
    })
  })
})

describe('triStockToAvailability', () => {
  it('maps tri-state values to availability statuses', () => {
    expect(triStockToAvailability('off')).toBeUndefined()
    expect(triStockToAvailability('include')).toEqual(['IN_STOCK'])
    expect(triStockToAvailability('exclude')).toEqual(['OUT_OF_STOCK'])
  })

  it('updates correctly as triStock state changes', () => {
    const { result } = renderHook(() => useCatalogFilters())
    expect(triStockToAvailability(result.current.triStock)).toBeUndefined()
    act(() => result.current.setTriStock('include'))
    expect(triStockToAvailability(result.current.triStock)).toEqual(['IN_STOCK'])
    act(() => result.current.setTriStock('exclude'))
    expect(triStockToAvailability(result.current.triStock)).toEqual(['OUT_OF_STOCK'])
  })
})

