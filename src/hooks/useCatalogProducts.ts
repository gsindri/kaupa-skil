import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchPublicCatalogItems,
  PublicCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog';
import type { SortOrder } from '@/state/catalogFilters';
import { stateKeyFragment } from '@/lib/catalogState';

export type { PublicCatalogItem };

export function useCatalogProducts(filters: PublicCatalogFilters, sort: SortOrder) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel: any = (supabase as any)?.channel?.('catalog-products');
    if (!channel?.on) return;

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

    channel.subscribe?.();

    return () => {
      channel.unsubscribe?.();
    };
  }, [queryClient]);

  const stateHash = stateKeyFragment({ filters, sort } as any);

  const query = useQuery({
    queryKey: ['catalog', stateHash],
    queryFn: () => fetchPublicCatalogItems(filters, sort),
    keepPreviousData: true,
    staleTime: 30_000,
    gcTime: 900_000,
  });

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  };
}

