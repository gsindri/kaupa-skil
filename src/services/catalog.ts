import { supabase } from '@/integrations/supabase/client'

export type FacetFilters = {
  search?: string
  brand?: string
  category?: string
  supplier?: string
  availability?: string
  packSizeRange?: string
}

export type PublicCatalogFilters = FacetFilters & {
  page?: number
}

export type OrgCatalogFilters = FacetFilters & {
  onlyWithPrice?: boolean
}

export interface PublicCatalogItem {
  catalog_id: string
  name: string
  brand: string | null
  image_main: string | null
  supplier_count: number
  best_price: number | null
}

async function getCatalogIdsForFilters(filters: FacetFilters) {
  let facetQuery: any = supabase.from('catalog_facets').select('catalog_id', { distinct: true })
  if (filters.search) facetQuery = facetQuery.ilike('name', `%${filters.search}%`)
  if (filters.brand) facetQuery = facetQuery.eq('brand', filters.brand)
  if (filters.category) facetQuery = facetQuery.eq('category_id', filters.category)
  if (filters.supplier) facetQuery = facetQuery.eq('supplier_id', filters.supplier)
  if (filters.availability) facetQuery = facetQuery.eq('availability', filters.availability)
  if (filters.packSizeRange) facetQuery = facetQuery.eq('pack_size_range', filters.packSizeRange)
  const { data, error } = await facetQuery
  if (error) throw error
  return (data ?? []).map((d: any) => d.catalog_id)
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
): Promise<PublicCatalogItem[]> {
  let query: any = supabase.from('v_public_catalog').select('*')
  if (
    filters.category ||
    filters.supplier ||
    filters.availability ||
    filters.packSizeRange
  ) {
    const ids = await getCatalogIdsForFilters(filters)
    if (ids.length === 0) return []
    query = query.in('catalog_id', ids)
  }
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  const page = filters.page ?? 1
  const PAGE_SIZE = 50
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error } = await query.range(from, to)
  if (error) throw error
  const items = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? item.sample_image_url ?? null,
    supplier_count: item.suppliers_count ?? item.supplier_count ?? 0,
    best_price: item.best_price ?? null,
  }))
  console.log('fetchPublicCatalogItems', items)
  return items
}

export async function fetchOrgCatalogItems(orgId: string, filters: OrgCatalogFilters) {
  let query: any = supabase.rpc('v_org_catalog', { _org: orgId })
  if (
    filters.category ||
    filters.supplier ||
    filters.availability ||
    filters.packSizeRange
  ) {
    const ids = await getCatalogIdsForFilters(filters)
    if (ids.length === 0) return []
    query = query.in('catalog_id', ids)
  }
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  const { data, error } = await query
  if (error) throw error
  return data
}

export interface FacetCount {
  id: string
  name: string
  count: number
}

export interface CatalogFacets {
  categories: FacetCount[]
  suppliers: FacetCount[]
  availability: FacetCount[]
  packSizeRanges: FacetCount[]
  brands: FacetCount[]
}

export async function fetchCatalogFacets(filters: FacetFilters): Promise<CatalogFacets> {
  const { data, error } = await supabase.rpc('fetch_catalog_facets', {
    _search: filters.search ?? null,
    _category_ids: filters.category ? [filters.category] : null,
    _supplier_ids: filters.supplier ? [filters.supplier] : null,
    _availability: filters.availability ? [filters.availability] : null,
    _pack_size_ranges: filters.packSizeRange ? [filters.packSizeRange] : null,
    _brands: filters.brand ? [filters.brand] : null,
  })
  if (error) throw error
  const result: CatalogFacets = {
    categories: [],
    suppliers: [],
    availability: [],
    packSizeRanges: [],
    brands: [],
  }
  for (const row of data ?? []) {
    const item = { id: row.id, name: row.name, count: row.count }
    switch (row.facet) {
      case 'category':
        result.categories.push(item)
        break
      case 'supplier':
        result.suppliers.push(item)
        break
      case 'availability':
        result.availability.push(item)
        break
      case 'pack_size_range':
        result.packSizeRanges.push(item)
        break
      case 'brand':
        result.brands.push(item)
        break
    }
  }
  return result
}

