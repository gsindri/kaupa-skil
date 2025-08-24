import { supabase } from '@/integrations/supabase/client'

export type PublicCatalogFilters = {
  search?: string
  brand?: string
}

export type OrgCatalogFilters = {
  search?: string
  brand?: string
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

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
): Promise<PublicCatalogItem[]> {
  let query: any = supabase.from('v_public_catalog').select('*')
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  const { data, error } = await query.limit(50)
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
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  const { data, error } = await query
  if (error) throw error
  return data
}

