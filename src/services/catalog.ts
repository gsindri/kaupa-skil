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
  cursor?: string | null
}

export type OrgCatalogFilters = FacetFilters & {
  onlyWithPrice?: boolean
  cursor?: string | null
}

export interface PublicCatalogItem {
  catalog_id: string
  name: string
  brand: string | null
  image_main: string | null
  pack_size: string | null
  availability: string | null
  supplier_count: number
  best_price: number | null
}

export interface OrgCatalogItem {
  catalog_id: string
  name: string
  brand: string | null
  image_main: string | null
  pack_size: string | null
  availability: string | null
  supplier_count: number
  best_price: number | null
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
): Promise<{ items: PublicCatalogItem[]; nextCursor: string | null }> {
  let query: any = supabase
    .from('v_public_catalog')
    .select(
      'catalog_id, name, brand, image_main, pack_size, availability_text, image_url, supplier_count'
    )
    .order('catalog_id', { ascending: true })
    .limit(50)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error } = await query
  if (error) throw error

  const items: PublicCatalogItem[] = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? item.image_url ?? null,
    pack_size: item.pack_size ?? null,
    availability: item.availability_text ?? null,
    supplier_count: item.supplier_count ?? 0,
    best_price: null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor }
}

export async function fetchOrgCatalogItems(
  orgId: string,
  filters: OrgCatalogFilters,
): Promise<{ items: OrgCatalogItem[]; nextCursor: string | null }> {
  let query: any = supabase
    .rpc('v_org_catalog', { _org: orgId })
    .select(
      'catalog_id, name, brand, image_main, size, availability_text, image_url, supplier_count, best_price',
    )
    .order('catalog_id', { ascending: true })
    .limit(50)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error } = await query
  if (error) throw error

  const items: OrgCatalogItem[] = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? item.image_url ?? null,
    pack_size: item.size ?? null,
    availability: item.availability_text ?? null,
    supplier_count: item.supplier_count ?? 0,
    best_price: item.best_price ?? null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor }
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
}

export async function fetchCatalogItemSuppliers(
  catalogId: string,
  orgId?: string | null,
): Promise<CatalogSupplier[]> {
  const { data, error } = await supabase
    .from('supplier_product')
    .select(
      'supplier_id, pack_size, availability_text, suppliers(name), offer(price, org_id)'
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
    }
  })
}

