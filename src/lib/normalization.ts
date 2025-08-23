const UNIT_MAP: Record<string, { multiplier: number; unit: string }> = {
  kg: { multiplier: 1000, unit: 'g' },
  g: { multiplier: 1, unit: 'g' },
  l: { multiplier: 1000, unit: 'ml' },
  ml: { multiplier: 1, unit: 'ml' },
  pcs: { multiplier: 1, unit: 'pcs' },
  pc: { multiplier: 1, unit: 'pcs' }
}

export function normalizeUnit(input: string): { amount: number; unit: string } {
  const match = input.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pc)$/)
  if (!match) return { amount: NaN, unit: '' }
  const value = parseFloat(match[1])
  const { multiplier, unit } = UNIT_MAP[match[2]]
  return { amount: value * multiplier, unit }
}

export function normalizeBrand(brand: string): string {
  return brand.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function cleanName(name: string): string {
  return name
    .replace(/promo pack/gi, '')
    .replace(/-new/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateSupplierProduct(row: {
  barcode?: string
  unit?: string
  price?: number
  previous_price?: number
}): string[] {
  const issues: string[] = []
  if (!row.barcode) issues.push('missing barcode')
  if (row.unit && !UNIT_MAP[row.unit.toLowerCase()]) issues.push('invalid unit')
  if (row.price && row.previous_price && row.price > row.previous_price * 2) {
    issues.push('suspicious price jump')
  }
  return issues
}
