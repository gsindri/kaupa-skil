import { useQuery } from '@tanstack/react-query'
import { fetchCatalogSuggestions } from '@/services/catalog'

export function useCatalogSearchSuggestions(search: string, orgId?: string) {
  return useQuery({
    queryKey: ['catalog-suggestions', orgId, search],
    queryFn: () => fetchCatalogSuggestions(search, orgId),
    enabled: !!search,
  })
}
