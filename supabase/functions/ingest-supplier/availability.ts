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
  if (/\bekki\b.*\btil\s+á\s+lager\b/.test(cleaned)) return 'OUT_OF_STOCK'
  if (cleaned.includes('lítið') || cleaned.includes('fátt')) return 'LOW_STOCK'
  if (/\btil\s+á\s+lager\b/.test(cleaned) && !/\bekki\b/.test(cleaned)) return 'IN_STOCK'
  return 'UNKNOWN'
}

export default {
  cleanAvailabilityText,
  availabilityStatusFromText
}
