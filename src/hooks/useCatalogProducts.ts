import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

type Filters = { search?: string; brand?: string }

export function useCatalogProducts(filters: Filters) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: async () => {
      let q: any = supabase.from('v_public_catalog').select('*')
      if (filters.search) q = q.ilike('name', `%${filters.search}%`)
      if (filters.brand)  q = q.eq('brand', filters.brand)
      const { data, error } = await q.limit(50)
      if (error) throw error
      return data
    },
  })
}
