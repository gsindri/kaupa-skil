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

export async function fetchPublicCatalogItems(filters: PublicCatalogFilters) {
  let query: any = supabase.from('v_public_catalog').select('*')
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.brand) query = query.eq('brand', filters.brand)
  const { data, error } = await query.limit(50)
  if (error) throw error
  return data
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

