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
  
  // Check for out of stock patterns
  if (cleaned.includes('ekki til') || cleaned.includes('ekki á lager') || cleaned.includes('útselt')) {
    return 'OUT_OF_STOCK'
  }
  
  // Check for low stock patterns
  if (cleaned.includes('lítið') || cleaned.includes('fátt')) {
    return 'LOW_STOCK'
  }
  
  // Check for in stock patterns
  if (cleaned.includes('til á lager') || cleaned.includes('á lager')) {
    return 'IN_STOCK'
  }
  
  return 'UNKNOWN'
}

export default {
  cleanAvailabilityText,
  availabilityStatusFromText
}
