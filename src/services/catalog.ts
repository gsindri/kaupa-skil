import { supabase } from '@/integrations/supabase/client'

export type PublicCatalogFilters = {
  search?: string
  brand?: string
  cursor?: string | null
}

export type OrgCatalogFilters = {
  search?: string
  brand?: string
  onlyWithPrice?: boolean
  cursor?: string | null
}

export interface PublicCatalogItem {
  catalog_id: string
  name: string
  brand: string | null
  image_main: string | null
  supplier_count: number
  best_price: number | null
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
): Promise<{ items: PublicCatalogItem[]; nextCursor: string | null }> {
  const PAGE_SIZE = 50
  let query: any = supabase
    .from('v_public_catalog')
    .select('*')
    .order('catalog_id', { ascending: true })
    .limit(PAGE_SIZE)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error } = await query
  if (error) throw error
  const items = (data ?? []).map((item: any) => ({
    catalog_id: item.catalog_id,
    name: item.name,
    brand: item.brand ?? null,
    image_main: item.image_main ?? item.sample_image_url ?? null,
    supplier_count: item.suppliers_count ?? item.supplier_count ?? 0,
    best_price: item.best_price ?? null,
  }))
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  console.log('fetchPublicCatalogItems', items, nextCursor)
  return { items, nextCursor }
}

export async function fetchOrgCatalogItems(
  orgId: string,
  filters: OrgCatalogFilters,
): Promise<{ items: any[]; nextCursor: string | null }> {
  const PAGE_SIZE = 50
  let query: any = supabase
    .rpc('v_org_catalog', { _org: orgId })
    .order('catalog_id', { ascending: true })
    .limit(PAGE_SIZE)

  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  if (filters.cursor) query = query.gt('catalog_id', filters.cursor)

  const { data, error } = await query
  if (error) throw error
  const items = data ?? []
  const nextCursor = items.length ? items[items.length - 1].catalog_id : null
  return { items, nextCursor }
}

