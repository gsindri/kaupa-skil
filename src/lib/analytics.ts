import { AnalyticsTracker } from "@/components/quick/AnalyticsTrackerUtils"

interface Filters {
  [key: string]: any
}

const SEARCH_KEY = "analytics_searches"
const FILTER_KEY = "analytics_filters"
const ZERO_KEY = "analytics_zero_results"
const FACET_KEY = "analytics_facets"

function load<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage write errors
  }
}

export function logSearch(query: string) {
  if (!query) return
  const searches = load<Record<string, number>>(SEARCH_KEY, {})
  searches[query] = (searches[query] || 0) + 1
  save(SEARCH_KEY, searches)
  AnalyticsTracker.track('search', { query })
}

export function logFilter(filters: Filters) {
  const all = load<Record<string, Record<string, number>>>(FILTER_KEY, {})
  Object.entries(filters).forEach(([facet, value]) => {
    if (value === undefined || value === '') return
    const str = String(value)
    all[facet] = all[facet] || {}
    all[facet][str] = (all[facet][str] || 0) + 1
  })
  save(FILTER_KEY, all)
  AnalyticsTracker.track('filter', filters)
}

export function logZeroResults(query: string, filters: Filters) {
  const zero = load<{ query: string; filters: Filters; timestamp: number }[]>(ZERO_KEY, [])
  zero.push({ query, filters, timestamp: Date.now() })
  save(ZERO_KEY, zero)
  AnalyticsTracker.track('zero_results', { query, filters })
}

export function logFacetInteraction(facet: string, value: any) {
  const facets = load<Record<string, Record<string, number>>>(FACET_KEY, {})
  const str = String(value)
  facets[facet] = facets[facet] || {}
  facets[facet][str] = (facets[facet][str] || 0) + 1
  save(FACET_KEY, facets)
  AnalyticsTracker.track('facet_interaction', { facet, value })
}

export function getDefaultFilters(): Filters {
  const filters = load<Record<string, Record<string, number>>>(FILTER_KEY, {})
  const defaults: Filters = {}
  Object.entries(filters).forEach(([facet, values]) => {
    let top: string | null = null
    let max = 0
    Object.entries(values).forEach(([value, count]) => {
      if (count > max) {
        max = count
        top = value
      }
    })
    if (top !== null) {
      defaults[facet] = top === 'true' ? true : top === 'false' ? false : top
    }
  })
  return defaults
}

export function getPopularFacets(limit = 5) {
  const facets = load<Record<string, Record<string, number>>>(FACET_KEY, {})
  const popular: { facet: string; value: string; count: number }[] = []
  Object.entries(facets).forEach(([facet, values]) => {
    Object.entries(values).forEach(([value, count]) => {
      popular.push({ facet, value, count })
    })
  })
  popular.sort((a, b) => b.count - a.count)
  return popular.slice(0, limit)
}

