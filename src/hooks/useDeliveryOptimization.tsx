
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/contexts/useBasket'
import { deliveryCalculator } from '@/services/DeliveryCalculator'
import type { DeliveryCalculation, OrderDeliveryOptimization } from '@/lib/types/delivery'

export function useDeliveryCalculation() {
  const { items } = useCart()

  return useQuery({
    queryKey: ['delivery-calculation', items],
    queryFn: () => deliveryCalculator.calculateOrderDelivery(items),
    enabled: items.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDeliveryOptimization() {
  const { items } = useCart()

  return useQuery({
    queryKey: ['delivery-optimization', items],
    queryFn: () => deliveryCalculator.optimizeOrder(items),
    enabled: items.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
