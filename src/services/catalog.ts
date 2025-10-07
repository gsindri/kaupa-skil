import { supabase } from '@/integrations/supabase/client'
import type { SortOrder, TriState } from '@/state/catalogFiltersStore'

export type FacetFilters = {
  search?: string
  brand?: string[]
  category?: string[]
  supplier?: string[]
  availability?: string[]
  packSizeRange?: { min?: number; max?: number } | null
}

function packSizeRangeToString(range: { min?: number; max?: number }): string {
  const { min, max } = range
  if (min != null && max != null) return `${min}-${max}`
  if (min != null) return `${min}+`
  if (max != null) return `0-${max}`
  return ''
}

export type PublicCatalogFilters = FacetFilters & {
  cursor?: string | null
  onlyWithPrice?: boolean
  onSpecial?: boolean
}

export type OrgCatalogFilters = FacetFilters & {
  onlyWithPrice?: boolean
  mySuppliers?: Exclude<TriState, 'off'>
  onSpecial?: boolean
  cursor?: string | null
}

// Availability statuses returned from the catalog views.
// Keep in sync with the values generated in the Supabase views.
export type AvailabilityStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'UNKNOWN'

export interface PublicCatalogItem {
  catalog_id: string
  name: string
  brand?: string | null
  /** Canonical pack size of the product (e.g. 1kg) */
  canonical_pack?: string | null
  /** Available supplier pack sizes */
  pack_sizes?: string[] | null
  /** Category tags from all suppliers */
  category_tags?: string[][] | null
  suppliers_count: number
  supplier_ids?: string[] | null
  supplier_names?: string[] | null
  supplier_logo_urls?: string[] | null
  active_supplier_count?: number
  sample_image_url?: string | null
  availability_text?: string | null
  availability_status?: AvailabilityStatus | null
  availability_updated_at?: string | null
  sample_source_url?: string | null
  /** Optional price information when available */
  best_price?: number | null
}

export async function fetchCatalogItemById(
  catalogId: string,
): Promise<PublicCatalogItem | null> {
  const { data, error } = await supabase
    .from('v_public_catalog')
    .select(
      'catalog_id, name, brand, canonical_pack, pack_sizes, suppliers_count, supplier_ids, supplier_names, supplier_logo_urls, active_supplier_count, sample_image_url, sample_source_url, availability_status, availability_text, availability_updated_at, best_price, category_tags',
    )
    .eq('catalog_id', catalogId)
    .limit(1)

  if (error) throw error

  const row: any | undefined = data?.[0]
  if (!row) return null

  return {
    catalog_id: row.catalog_id,
    name: row.name,
    brand: row.brand ?? null,
    canonical_pack: row.canonical_pack ?? null,
    pack_sizes: row.pack_sizes ?? null,
    category_tags: row.category_tags ?? null,
    suppliers_count: row.suppliers_count ?? row.supplier_count ?? 0,
    supplier_ids: row.supplier_ids ?? null,
    supplier_names: row.supplier_names ?? null,
    supplier_logo_urls: row.supplier_logo_urls ?? null,
    active_supplier_count: row.active_supplier_count ?? 0,
    sample_image_url: row.sample_image_url ?? row.image_url ?? null,
    sample_source_url: row.sample_source_url ?? null,
    availability_status: (row.availability_status ?? null) as AvailabilityStatus | null,
    availability_text: row.availability_text ?? null,
    availability_updated_at: row.availability_updated_at ?? null,
    best_price: row.best_price ?? null,
  }
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
  sort: SortOrder,
): Promise<{ items: PublicCatalogItem[]; nextCursor: string | null; total: number }> {
  // Use the original view name with proper RLS policies
  let query: any = supabase
    .from('v_public_catalog')
    .select(
      'catalog_id, name, brand, canonical_pack, pack_sizes, suppliers_count, supplier_ids, supplier_names, supplier_logo_urls, active_supplier_count, sample_image_url, sample_source_url, availability_status, availability_text, availability_updated_at, best_price, category_tags',
      { count: 'exact' },
    )

  if (sort === 'az') {
    query = query.order('name', { ascending: true }).order('catalog_id', { ascending: true })
  } else {
    query = query.order('catalog_id', { ascending: true })
  }

  query = query.limit(50)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand?.length) query = query.in('brand', filters.brand)
  if (filters.category?.length) {
    // Filter by category using the category_tags array
    query = query.overlaps('category_tags', filters.category)
  }
  if (filters.supplier?.length) {
    query = query.overlaps('supplier_ids', filters.supplier)
  }
  if (filters.onSpecial !== undefined) {
    query = query.eq('on_special', filters.onSpecial)
  }
  // Skip pricing filter when no pricing data is available
  // if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  if (filters.availability && filters.availability.length) {
    query = query.in('availability_status', filters.availability)
  }
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error, count } = await query
  if (error) throw error

  // Deduplicate catalog entries by catalog_id in case the view returns duplicates
  const rows: any[] = data ?? []
  const seen = new Set<string>()
  const deduped = rows.filter(r => {
    if (seen.has(r.catalog_id)) return false
    seen.add(r.catalog_id)
    return true
  })

  const items: PublicCatalogItem[] = deduped.map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    canonical_pack: item.canonical_pack ?? null,
    pack_sizes: item.pack_sizes ?? null,
    category_tags: item.category_tags ?? null,
    suppliers_count: item.suppliers_count ?? item.supplier_count ?? 0,
    supplier_ids: item.supplier_ids ?? null,
    supplier_names: item.supplier_names ?? null,
    supplier_logo_urls: item.supplier_logo_urls ?? null,
    active_supplier_count: item.active_supplier_count ?? 0,
    sample_image_url: item.sample_image_url ?? item.image_url ?? null,
    availability_text: item.availability_text ?? null,
    availability_status: (item.availability_status ?? null) as AvailabilityStatus | null,
    availability_updated_at: item.availability_updated_at ?? null,
    sample_source_url: item.sample_source_url ?? null,
    best_price: item.best_price ?? null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor, total: count ?? items.length }
}

export async function fetchOrgCatalogItems(
  orgId: string,
  filters: OrgCatalogFilters,
  sort: SortOrder,
): Promise<{ items: PublicCatalogItem[]; nextCursor: string | null; total: number }> {
  try {
    // Try organization-specific catalog first
    let query: any = supabase
      .rpc('v_org_catalog', { _org: orgId })
      .select(
        'catalog_id, name, brand, canonical_pack, pack_sizes, suppliers_count, supplier_ids, supplier_names, supplier_logo_urls, active_supplier_count, sample_image_url, sample_source_url, availability_status, availability_text, availability_updated_at, best_price, category_tags, on_special, is_my_supplier'
      )

  if (sort === 'az') {
    query = query.order('name', { ascending: true }).order('catalog_id', { ascending: true })
  } else {
    query = query.order('catalog_id', { ascending: true })
  }

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand?.length) query = query.in('brand', filters.brand)
  if (filters.category?.length) query = query.overlaps('category_tags', filters.category)
  if (filters.supplier?.length) query = query.overlaps('supplier_ids', filters.supplier)
  if (filters.onSpecial !== undefined) {
    query = query.eq('on_special', filters.onSpecial)
  }
  if (filters.mySuppliers === 'include') {
    query = query.eq('is_my_supplier', true)
  } else if (filters.mySuppliers === 'exclude') {
    query = query.neq('is_my_supplier', true)
  }

  // Skip pricing filter when no pricing data is available
  // if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  if (filters.availability && filters.availability.length) {
    query = query.in('availability_status', filters.availability)
  }
  
  // Add cursor-based pagination
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  query = query.limit(50)

    const { data, error } = await query
    if (error) throw error

    // Deduplicate any duplicate catalog rows returned from the view
    const rows: any[] = data ?? []
    const seen = new Set<string>()
    const deduped = rows.filter(r => {
      if (seen.has(r.catalog_id)) return false
      seen.add(r.catalog_id)
      return true
    })

    const items: PublicCatalogItem[] = deduped.map((item: any) => ({
      catalog_id: item.catalog_id,
      name: item.name,
      brand: item.brand ?? null,
      canonical_pack: item.canonical_pack ?? null,
      pack_sizes: item.pack_sizes ?? null,
      category_tags: item.category_tags ?? null,
      suppliers_count: item.suppliers_count ?? item.supplier_count ?? 0,
      supplier_ids: item.supplier_ids ?? null,
      supplier_names: item.supplier_names ?? null,
      supplier_logo_urls: item.supplier_logo_urls ?? null,
      active_supplier_count: item.active_supplier_count ?? 0,
      sample_image_url: item.sample_image_url ?? item.image_url ?? null,
      availability_text: item.availability_text ?? null,
      availability_status: (item.availability_status ?? null) as AvailabilityStatus | null,
      availability_updated_at: item.availability_updated_at ?? null,
      sample_source_url: item.sample_source_url ?? null,
      best_price: item.best_price ?? null,
    }))
    const nextCursor = items.length ? items[items.length - 1].catalog_id : null
    return { items, nextCursor, total: items.length }
  } catch (error) {
    // Fallback to public catalog if org-specific function doesn't exist or fails
    console.log('Organization catalog not available, falling back to public catalog:', error)
    const publicFilters: PublicCatalogFilters = {
      search: filters.search,
      brand: filters.brand,
      category: filters.category,
      supplier: filters.supplier,
      availability: filters.availability,
      packSizeRange: filters.packSizeRange,
      onlyWithPrice: filters.onlyWithPrice,
      onSpecial: filters.onSpecial,
      cursor: filters.cursor,
    }
    return await fetchPublicCatalogItems(publicFilters, sort)
  }
}

export async function fetchCatalogSuggestions(
  search: string,
  orgId?: string,
): Promise<string[]> {
  if (!search) return []
  try {
    let query: any
    if (orgId) {
      query = supabase
        .from('v_org_catalog')
        .select('name')
        .eq('org_id', orgId)
        .ilike('name', `%${search}%`)
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
    if (error) {
      console.error('Error fetching catalog suggestions:', error)
      return []
    }
    return (data ?? []).map((item: any) => item.name as string)
  } catch (err) {
    console.error('Error fetching catalog suggestions:', err)
    return []
  }
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
    _category_ids: filters.category && filters.category.length ? filters.category : null,
    _supplier_ids: filters.supplier && filters.supplier.length ? filters.supplier : null,
    _availability:
      filters.availability && filters.availability.length
        ? filters.availability
        : null,
    _pack_size_ranges: (() => {
      const range = filters.packSizeRange
      if (!range || (range.min === undefined && range.max === undefined)) {
        return null
      }
      return [packSizeRangeToString(range)]
    })(),
    _brands: filters.brand && filters.brand.length ? filters.brand : null,
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
  logo_url: string | null
}

export async function fetchCatalogItemSuppliers(
  catalogId: string,
  orgId?: string | null,
): Promise<CatalogSupplier[]> {
  const { data, error } = await supabase
    .from('supplier_product')
    .select(
      'supplier_id, pack_size, availability_text, suppliers(name, logo_url), offer(price, currency, org_id)'
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
      logo_url: supplier?.logo_url ?? null,
      pack_size: item.pack_size ?? null,
      availability: item.availability_text ?? null,
      price: offer?.price ?? null,
      currency: offer?.currency ?? null,
    }
  })
}

