import { supabase } from '@/integrations/supabase/client'

export type PublicCatalogFilters = {
  search?: string
  brand?: string
  page?: number
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
  pack_size: string | null
  availability: string | null
  supplier_count: number
  best_price: number | null
}

export async function fetchPublicCatalogItems(
  filters: PublicCatalogFilters,
): Promise<PublicCatalogItem[]> {
  let query: any = supabase.from('v_public_catalog').select('*')
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
    image_main: item.image_main ?? item.image_url ?? item.sample_image_url ?? null,
    pack_size: item.pack_size ?? null,
    availability: item.availability_text ?? null,
    supplier_count: item.suppliers_count ?? item.supplier_count ?? 0,
    best_price: item.best_price ?? null,
  }))
  console.log('fetchPublicCatalogItems', items)
  return items
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

export async function fetchOrgCatalogItems(orgId: string, filters: OrgCatalogFilters) {
  let query: any = supabase.rpc('v_org_catalog', { _org: orgId })
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.onlyWithPrice) query = query.not('best_price', 'is', null)
  const { data, error } = await query
  if (error) throw error
  return data
}

