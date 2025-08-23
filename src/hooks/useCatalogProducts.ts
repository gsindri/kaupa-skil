import { useQuery } from '@tanstack/react-query'
import { fetchPublicCatalogItems } from '@/services/catalog'

type Filters = { search?: string; brand?: string }

export function useCatalogProducts(filters: Filters) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: () => fetchPublicCatalogItems(filters),
  })
}
