
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/contexts/useBasket'
import { orderingSuggestions } from '@/services/OrderingSuggestions'

export function useOrderingSuggestions() {
  const { items } = useCart()
  const key = items
    .map(i => `${i.supplierId}:${i.supplierItemId}:${i.quantity}`)
    .sort()
    .join('|')

  return useQuery({
    queryKey: ['ordering-suggestions', key],
    queryFn: () => orderingSuggestions.generateSuggestions(items),
    enabled: items.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
