import { describe, it, expect } from 'vitest'
import { toggleArray, toggleTri, createEmptyFilters } from '../catalogFilters'

describe('catalogFilters helpers', () => {
  it('toggleArray adds and removes', () => {
    let arr: string[] = []
    arr = toggleArray(arr, 'a')
    expect(arr).toEqual(['a'])
    arr = toggleArray(arr, 'a')
    expect(arr).toEqual([])
  })

  it('toggleTri handles modes', () => {
    expect(toggleTri(undefined, 'include')).toBe(1)
    expect(toggleTri(1, 'include')).toBe(0)
    expect(toggleTri(undefined, 'exclude')).toBe(-1)
    expect(toggleTri(-1, 'exclude')).toBe(0)
    expect(toggleTri(0, 'cycle')).toBe(1)
    expect(toggleTri(1, 'cycle')).toBe(-1)
    expect(toggleTri(-1, 'cycle')).toBe(0)
  })

  it('createEmptyFilters returns defaults', () => {
    const f = createEmptyFilters()
    expect(f.availability).toBe('all')
    expect(f.categories).toEqual([])
    expect(f.brands).toEqual({ include: [], exclude: [] })
    expect(f.suppliers).toEqual({})
  })
})
