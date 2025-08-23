import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

type Filters = { search?: string; brand?: string; onlyWithPrice?: boolean }

export function useOrgCatalog(orgId: string, filters: Filters) {
  return useQuery({
    queryKey: ['orgCatalog', orgId, filters],
    queryFn: async () => {
      let q: any = supabase.rpc('v_org_catalog', { _org: orgId })
      if (filters.search) q = q.ilike('name', `%${filters.search}%`)
      if (filters.brand)  q = q.eq('brand', filters.brand)
      if (filters.onlyWithPrice) q = q.not('best_price', 'is', null)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!orgId,
  })
}
