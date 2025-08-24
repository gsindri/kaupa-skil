import { useQuery } from '@tanstack/react-query'
import { fetchPublicCatalogItems, type PublicCatalogItem } from '@/services/catalog'

type Filters = { search?: string; brand?: string }

export function useCatalogProducts(filters: Filters) {
  return useQuery<PublicCatalogItem[]>({
    queryKey: ['catalog', filters],
    queryFn: () => fetchPublicCatalogItems(filters),
  })
}
