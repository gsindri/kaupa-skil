import { supabase } from '@/integrations/supabase/client'
import type { SortOrder } from '@/state/catalogFilters'

export type FacetFilters = {
  search?: string
  brand?: string
  category?: string
  supplier?: string
  availability?: string
  packSizeRange?: string
}

export type PublicCatalogFilters = FacetFilters & {
  cursor?: string | null
  onlyWithPrice?: boolean
  inStock?: boolean
  onSpecial?: boolean
}

export type OrgCatalogFilters = FacetFilters & {
  onlyWithPrice?: boolean
  mySuppliers?: boolean
  inStock?: boolean
  onSpecial?: boolean
  cursor?: string | null
}

export interface CatalogItem {
  catalog_id: string
  name: string
  brand: string | null
  image_main: string | null
  pack_size: string | null
  availability: string | null
  supplier_count: number
  suppliers: string[]
  best_price: number | null
  currency: string | null
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
  sort: SortOrder,
): Promise<{ items: CatalogItem[]; nextCursor: string | null; total: number }> {
  let query: any = supabase
    .from('v_public_catalog')
    .select(
      'catalog_id, name, brand, image_main, pack_size, availability_text, availability, supplier_count, supplier_names',
      { count: 'exact' },
    )

  if (sort === 'az') {
    query = query.order('name', { ascending: true }).order('catalog_id', { ascending: true })
  } else {
    query = query.order('catalog_id', { ascending: true })
  }

  query = query.limit(50)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.supplier) query = query.eq('supplier_id', filters.supplier)
  if (filters.availability) query = query.eq('availability', filters.availability)
  if (filters.packSizeRange)
    query = query.eq('pack_size_range', filters.packSizeRange)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error, count } = await query
  if (error) throw error

  const items: CatalogItem[] = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? null,
    pack_size: item.pack_size ?? null,
    availability: item.availability ?? item.availability_text ?? null,
    supplier_count: item.supplier_count ?? 0,
    suppliers: item.supplier_names ?? [],
    best_price: null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor, total: count ?? 0 }
}

export async function fetchOrgCatalogItems(
  orgId: string,
  filters: OrgCatalogFilters,
  sort: SortOrder,
): Promise<{ items: CatalogItem[]; nextCursor: string | null; total: number }> {
  let query: any = supabase.rpc('v_org_catalog', { _org: orgId })

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.supplier) query = query.eq('supplier_id', filters.supplier)
  if (filters.availability) query = query.eq('availability', filters.availability)
  if (filters.packSizeRange)
    query = query.eq('pack_size_range', filters.packSizeRange)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  query = query.select(
    'catalog_id, name, brand, image_main, size, availability, supplier_count, supplier_names, best_price, currency',
  )

  if (sort === 'az') {
    query = query.order('name', { ascending: true }).order('catalog_id', { ascending: true })
  } else {
    query = query.order('catalog_id', { ascending: true })
  }

  query = query.limit(50)

  const { data, error } = await query
  if (error) throw error

  const items: CatalogItem[] = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? null,
    pack_size: item.size ?? null,
    availability: item.availability ?? item.availability_text ?? null,
    supplier_count: item.supplier_count ?? 0,
    suppliers: item.supplier_names ?? [],
    best_price: item.best_price ?? null,
    currency: item.currency ?? null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor, total: items.length }
}

export async function fetchCatalogSuggestions(
  search: string,
  orgId?: string,
): Promise<string[]> {
  if (!search) return []
  let query: any
  if (orgId) {
    query = supabase
      .rpc('v_org_catalog', { _org: orgId })
      .ilike('name', `%${search}%`)
      .select('name')
      .order('name', { ascending: true })
      .limit(5)
  } else {
    query = supabase
      .from('v_public_catalog')
      .select('name')
      .ilike('name', `%${search}%`)
      .order('name', { ascending: true })
      .limit(5)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((item: any) => item.name as string)
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

export interface CatalogSupplier {
  supplier_id: string
  name: string
  pack_size: string | null
  availability: string | null
  price: number | null
  currency: string | null
}

export async function fetchCatalogItemSuppliers(
  catalogId: string,
  orgId?: string | null,
): Promise<CatalogSupplier[]> {
  const { data, error } = await supabase
    .from('supplier_product')
    .select(
      'supplier_id, pack_size, availability_text, suppliers(name), offer(price, currency, org_id)'
    )
    .eq('catalog_id', catalogId)

  if (error) throw error

  return (data ?? []).map((item: any) => {
    const supplier = Array.isArray(item.suppliers)
      ? item.suppliers[0]
      : item.suppliers
    const offers = Array.isArray(item.offer) ? item.offer : []
    const offer = orgId
      ? offers.find((o: any) => o.org_id === orgId)
      : null

    return {
      supplier_id: item.supplier_id,
      name: supplier?.name ?? '',
      pack_size: item.pack_size ?? null,
      availability: item.availability_text ?? null,
      price: offer?.price ?? null,
      currency: offer?.currency ?? null,
    }
  })
}

