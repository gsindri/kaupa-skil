
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/contexts/BasketProviderUtils'
import { orderingSuggestions } from '@/services/OrderingSuggestions'

export function useOrderingSuggestions() {
  const { items } = useCart()

  return useQuery({
    queryKey: ['ordering-suggestions', items],
    queryFn: () => orderingSuggestions.generateSuggestions(items),
    enabled: items.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
