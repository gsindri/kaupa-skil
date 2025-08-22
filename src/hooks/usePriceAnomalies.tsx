import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import type { PriceAnomaly } from '@/components/dashboard/PriceAnomalyAlert'

export function usePriceAnomalies() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['price-anomalies', profile?.tenant_id],
    queryFn: async (): Promise<PriceAnomaly[]> => {
      const tenantId = profile?.tenant_id
      const { data } = await supabase
        .from('price_anomalies')
        .select('id, item_name, supplier_name, type, severity, current_price, previous_price, change_percent, detected_at, description')
        .eq('tenant_id', tenantId)
        .order('detected_at', { ascending: false })
        .limit(50)

      return (
        data?.map((a: any) => ({
          id: a.id,
          itemName: a.item_name,
          supplier: a.supplier_name,
          type: a.type,
          severity: a.severity,
          currentPrice: a.current_price,
          previousPrice: a.previous_price,
          changePercent: a.change_percent,
          detectedAt: a.detected_at,
          description: a.description,
        })) || []
      )
    },
    enabled: !!profile,
    staleTime: 60 * 1000,
  })

  return { anomalies: data || [], isLoading }
}

