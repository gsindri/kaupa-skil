import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/useAuth'
import type { CatalogFilters, CatalogProduct } from './useCatalogProducts'

export interface OrgCatalogProduct extends CatalogProduct {
  price?: number
}

export function useOrgOffers(search: string, filters: CatalogFilters) {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id
  return useQuery({
    queryKey: queryKeys.catalog.org(orgId, { search, ...filters }),
    enabled: !!orgId,
    queryFn: async (): Promise<OrgCatalogProduct[]> => {
      const { data, error } = await supabase.rpc('v_org_catalog', {
        p_org_id: orgId,
        p_search: search || null,
        p_brand: filters.brand || null,
        p_supplier: filters.supplier || null,
        p_category: filters.category || null,
        p_has_price: filters.hasPrice ?? null
      })
      if (error) throw error
      return (data || []).map((item: any) => ({
        id: item.catalog_id,
        name: item.name,
        brand: item.brand,
        pack: item.size,
        image: item.image_main,
        suppliers: item.supplier_names || [],
        price: item.cheapest_price
      }))
    }
  })
}

export type { OrgCatalogProduct }
