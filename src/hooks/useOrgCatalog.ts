import { useQuery } from '@tanstack/react-query'
import { fetchOrgCatalogItems } from '@/services/catalog'

type Filters = { search?: string; brand?: string; onlyWithPrice?: boolean }

export function useOrgCatalog(orgId: string, filters: Filters) {
  return useQuery({
    queryKey: ['orgCatalog', orgId, filters],
    queryFn: () => fetchOrgCatalogItems(orgId, filters),
    enabled: !!orgId,
  })
}
