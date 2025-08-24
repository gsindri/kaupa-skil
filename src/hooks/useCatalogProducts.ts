import { useQuery } from '@tanstack/react-query'
import { fetchPublicCatalogItems, type PublicCatalogItem } from '@/services/catalog'

type Filters = { search?: string; brand?: string }

export function useCatalogProducts(filters: Filters) {
  const query = useQuery<PublicCatalogItem[]>({
    queryKey: ['catalog', filters],
    queryFn: () => fetchPublicCatalogItems(filters),
  })
  console.log('useCatalogProducts', query.data)
  return query
}
