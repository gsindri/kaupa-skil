import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

interface BenchmarkData {
  has_benchmark: boolean;
  benchmark: {
    avg_kr_per_unit: number;
    median_kr_per_unit: number;
    p25_kr_per_unit: number;
    p75_kr_per_unit: number;
    orders_count: number;
    distinct_orgs_count: number;
  } | null;
  user_price: {
    kr_per_unit: number;
    order_date: string;
  } | null;
  comparison: {
    vs_median_pct: number;
    vs_p25_pct: number;
    vs_p75_pct: number;
    message: string;
  } | null;
}

interface UsePriceBenchmarkOptions {
  supplierId: string;
  catalogProductId: string;
  enabled?: boolean;
}

export function usePriceBenchmark({
  supplierId,
  catalogProductId,
  enabled = true,
}: UsePriceBenchmarkOptions) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['price-benchmark', supplierId, catalogProductId, profile?.tenant_id],
    queryFn: async (): Promise<BenchmarkData | null> => {
      if (!profile?.tenant_id) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke('get-price-benchmark', {
        body: {
          supplier_id: supplierId,
          catalog_product_id: catalogProductId,
        },
      });

      if (error) {
        console.error('Error fetching benchmark:', error);
        return null;
      }

      return data;
    },
    enabled: enabled && !!profile?.tenant_id && !!supplierId && !!catalogProductId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
