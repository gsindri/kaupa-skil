
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/lib/types/database'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

export function useSupplierItems(supplierId?: string) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['supplier-items', supplierId],
    queryFn: async (): Promise<SupplierItem[]> => {
      if (!supplierId) return []
      
      const { data, error } = await supabase
        .from('supplier_items')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('last_seen_at', { ascending: false, nullsLast: true })

      if (error) throw error
      return data || []
    },
    enabled: !!supplierId
  })

  const getItemStats = () => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    const stats = {
      total: items.length,
      fresh: 0,
      recent: 0,
      aging: 0,
      stale: 0,
      neverSeen: 0
    }

    items.forEach(item => {
      if (!item.last_seen_at) {
        stats.neverSeen++
        return
      }

      const daysSinceLastSeen = now - new Date(item.last_seen_at).getTime()
      
      if (daysSinceLastSeen <= oneDay) {
        stats.fresh++
      } else if (daysSinceLastSeen <= oneWeek) {
        stats.recent++
      } else if (daysSinceLastSeen <= oneMonth) {
        stats.aging++
      } else {
        stats.stale++
      }
    })

    return stats
  }

  return {
    items,
    isLoading,
    error,
    stats: getItemStats()
  }
}
