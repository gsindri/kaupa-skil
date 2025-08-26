import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { fetchPublicCatalogItems, type PublicCatalogItem } from '@/services/catalog'

type Filters = { search?: string; brand?: string }

export function useCatalogProducts(filters: Filters) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel: any = (supabase as any)?.channel?.('catalog-products')
    if (!channel?.on) return

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )

    channel.subscribe?.()

    return () => {
      channel.unsubscribe?.()
    }
  }, [queryClient])

  const query = useQuery<PublicCatalogItem[]>({
    queryKey: ['catalog', filters],
    queryFn: () => fetchPublicCatalogItems(filters),
  })
  console.log('useCatalogProducts', query.data)
  return query
}
