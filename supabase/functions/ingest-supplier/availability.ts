export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

export function cleanAvailabilityText(text?: string | null): string | null {
  if (!text) return null
  return text
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function availabilityStatusFromText(text?: string | null): AvailabilityStatus {
  const cleaned = cleanAvailabilityText(text)
  if (!cleaned) return 'UNKNOWN'
  if (cleaned.includes('ekki') && cleaned.includes('til á lager')) {
    return 'OUT_OF_STOCK'
  }
  if (cleaned.includes('ylitid magn') || cleaned.includes('low stock') || cleaned.includes('limited')) {
    return 'LOW_STOCK'
  }
  if (cleaned.includes('til á lager')) {
    return 'IN_STOCK'
  }
  return 'UNKNOWN'
}

export default {
  cleanAvailabilityText,
  availabilityStatusFromText
}
