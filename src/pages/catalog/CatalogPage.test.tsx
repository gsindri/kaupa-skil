import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import CatalogPage from './CatalogPage'

// Mock ResizeObserver and IntersectionObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

const MockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(() => []),
}))

vi.stubGlobal('ResizeObserver', MockResizeObserver)
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
vi.stubGlobal('scrollTo', vi.fn())

const productsMock = [
  { catalog_id: '1', suppliers: [] },
  { catalog_id: '2', suppliers: [] },
  { catalog_id: '3', suppliers: [] },
  { catalog_id: '4', suppliers: [] },
  { catalog_id: '5', suppliers: [] },
  { catalog_id: '6', suppliers: [] },
  { catalog_id: '7', suppliers: ['s1'] },
  { catalog_id: '8', suppliers: ['s2'] },
]

vi.mock('@/components/catalog/SortDropdown', () => ({ SortDropdown: () => <div /> }))
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('lucide-react', () => ({ AlertCircle: () => <div />, Mic: () => <div />, X: () => <div /> }))
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ profile: { tenant_id: 'org1' } }) }))
const useCatalogProductsMock = vi.fn()
vi.mock('@/hooks/useCatalogProducts', () => ({
  useCatalogProducts: (...args: any[]) => useCatalogProductsMock(...args),
}))
useCatalogProductsMock.mockImplementation(() => ({
  data: productsMock,
  nextCursor: null,
  isFetching: false,
  error: null,
  isFetched: true,
}))
const useOrgCatalogMock = vi.fn()
vi.mock('@/hooks/useOrgCatalog', () => ({
  useOrgCatalog: (...args: any[]) => useOrgCatalogMock(...args),
}))
useOrgCatalogMock.mockImplementation(() => ({
  data: [],
  nextCursor: null,
  isFetching: false,
  error: null,
  isFetched: true,
}))
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: any) => v }))
vi.mock('@/components/catalog/CatalogTable', () => ({
  CatalogTable: ({ products }: any) => (
    <div data-testid="catalog-table">{products.length}</div>
  ),
}))
vi.mock('@/components/catalog/ProductCard', () => ({ ProductCard: () => <div /> }))
vi.mock('@/components/catalog/ProductCardSkeleton', () => ({ ProductCardSkeleton: () => <div /> }))
vi.mock('@/components/search/HeroSearchInput', () => ({ HeroSearchInput: () => <div /> }))
vi.mock('@/components/ui/filter-chip', () => ({ FilterChip: () => <div /> }))
vi.mock('@/components/catalog/CatalogFiltersPanel', () => ({ CatalogFiltersPanel: () => <div /> }))
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/lib/analytics', () => ({
  logFilter: vi.fn(),
  logFacetInteraction: vi.fn(),
  logSearch: vi.fn(),
  logZeroResults: vi.fn(),
}))
vi.mock('@/components/quick/AnalyticsTrackerUtils', () => ({ AnalyticsTracker: { track: vi.fn() } }))
vi.mock('@/components/place-order/ViewToggle', () => ({
  ViewToggle: ({ onChange }: any) => (
    <button onClick={() => onChange('list')}>list</button>
  ),
}))
vi.mock('@/components/debug/LayoutDebugger', () => ({ LayoutDebugger: () => <div /> }))
vi.mock('@/components/layout/FullWidthLayout', () => ({ FullWidthLayout: ({ children }: any) => <div>{children}</div> }))
var catalogFiltersStore: any
vi.mock('@/state/catalogFilters', () => {
  const { create } = require('zustand')
  catalogFiltersStore = create((set: any) => ({
    filters: {},
    setFilters: vi.fn(),
    onlyWithPrice: false,
    setOnlyWithPrice: vi.fn(),
    sort: 'relevance',
    setSort: vi.fn(),
    triStock: 'off',
    setTriStock: vi.fn(),
    triSpecial: 'off',
    setTriSpecial: (v: any) => set({ triSpecial: v }),
    triSuppliers: 'off',
    setTriSuppliers: (v: any) => set({ triSuppliers: v }),
  }))
  return {
    useCatalogFilters: (selector: any) => catalogFiltersStore(selector),
    shallow: (fn: any) => fn,
    SortOrder: {},
    triStockToAvailability: vi.fn(() => undefined),
  }
})
vi.mock('@/contexts/useBasket', () => ({ useCart: () => ({ addItem: vi.fn() }) }))
vi.mock('@/lib/images', () => ({ resolveImage: () => '' }))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams(), vi.fn()] }))

describe('CatalogPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useCatalogProductsMock.mockClear()
    useOrgCatalogMock.mockClear()
    catalogFiltersStore.setState({ triSpecial: 'off', triSuppliers: 'off' })
  })

  it('shows banner when connect pills are hidden', async () => {
    render(<CatalogPage />)
    await userEvent.click(screen.getByText('list'))
    await screen.findByTestId('alert')
    expect(screen.getByText('Connect suppliers to unlock prices.')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-table')).toBeInTheDocument()
    expect(localStorage.getItem('catalog-view')).toBe('list')
  })

  it('restores view preference from localStorage', () => {
    localStorage.setItem('catalog-view', 'list')
    render(<CatalogPage />)
    expect(screen.getByTestId('catalog-table')).toBeInTheDocument()
  })

  it('cycles triSuppliers filter without clearing results', async () => {
    render(<CatalogPage />)
    await userEvent.click(screen.getByText('list'))

    // initial state: off
    await screen.findByText('All suppliers')
    await screen.findByText('8')

    await userEvent.click(screen.getByText('All suppliers'))
    await screen.findByText('My suppliers')
    await screen.findByText('8')

    await userEvent.click(screen.getByText('My suppliers'))
    await screen.findByText('Not my suppliers')
    await screen.findByText('8')

    await userEvent.click(screen.getByText('Not my suppliers'))
    await screen.findByText('All suppliers')
    await screen.findByText('8')
  })

  it('applies onSpecial filter when triSpecial is include', () => {
    catalogFiltersStore.setState({ triSpecial: 'include' })
    render(<CatalogPage />)
    expect(useCatalogProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({ onSpecial: true }),
      'relevance',
    )
    expect(useOrgCatalogMock).toHaveBeenCalledWith(
      'org1',
      expect.objectContaining({ onSpecial: true }),
      'relevance',
    )
  })
})

