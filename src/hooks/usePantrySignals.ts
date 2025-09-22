import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface PantrySignalItem {
  id: string
  name: string
  brand?: string | null
  lastOrderedAt: string
  lastQuantity: number
  orderCount: number
}

export function usePantrySignals() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery<PantrySignalItem[]>({
    queryKey: [...queryKeys.dashboard.pantry(), profile?.tenant_id],
    queryFn: async () => {
      const query = supabase
        .from('order_lines')
        .select(`
          id,
          created_at,
          quantity,
          qty_packs,
          supplier_items (
            id,
            display_name,
            brand
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      const { data, error } = await query

      if (error) {
        console.warn('Error fetching pantry signals:', error)
        return []
      }

      const grouped = new Map<string, PantrySignalItem>()

      data?.forEach((line: any) => {
        const item = line?.supplier_items
        if (!item?.id) return

        const quantity = Number.isFinite(Number(line.quantity))
          ? Number(line.quantity)
          : Number.isFinite(Number(line.qty_packs))
            ? Number(line.qty_packs)
            : 0

        const existing = grouped.get(item.id)
        if (!existing) {
          grouped.set(item.id, {
            id: item.id,
            name: item.display_name ?? 'Unnamed item',
            brand: item.brand,
            lastOrderedAt: line.created_at,
            lastQuantity: quantity,
            orderCount: 1,
          })
        } else {
          existing.orderCount += 1
          const currentDate = new Date(line.created_at ?? Date.now()).getTime()
          const existingDate = new Date(existing.lastOrderedAt ?? Date.now()).getTime()
          if (currentDate > existingDate) {
            existing.lastOrderedAt = line.created_at
            existing.lastQuantity = quantity
          }
        }
      })

      return Array.from(grouped.values())
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  })

  return { items: data ?? [], isLoading }
}
