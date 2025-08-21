
import { deliveryRules } from '@/services/DeliveryRules'

export async function estimateFee(supplierId: string, subtotalExVat: number): Promise<number> {
  try {
    const rule = await deliveryRules.getRule(supplierId)
    if (!rule) return 0

    const threshold = rule.free_threshold_ex_vat
    return threshold !== null && subtotalExVat >= threshold ? 0 : rule.flat_fee
  } catch (error) {
    console.error('Failed to estimate delivery fee:', error)
    return 0
  }
}

export function calculateBreakEven(
  currentPrice: number,
  cheaperPrice: number,
  deliveryFee: number
): number {
  const unitSavings = currentPrice - cheaperPrice
  if (unitSavings <= 0) return 0

  return Math.ceil(deliveryFee / unitSavings)
}

export async function getDeliveryHint(supplierId: string): Promise<string | null> {
  try {
    const rule = await deliveryRules.getRule(supplierId)
    if (!rule || !rule.cutoff_time || !rule.delivery_days?.length) return null

    const today = new Date()
    const currentDay = today.getDay() === 0 ? 7 : today.getDay()

    const sortedDays = [...rule.delivery_days].sort((a, b) => a - b)
    const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]

    const daysUntil = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + daysUntil)
    const nextDeliveryDay = deliveryDate.toLocaleDateString('en-US', { weekday: 'short' })

    return `Order by ${rule.cutoff_time} for ${nextDeliveryDay}`
  } catch (error) {
    console.error('Failed to get delivery hint:', error)
    return null
  }
}
