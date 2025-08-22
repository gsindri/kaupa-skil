
export interface ExtractedItem {
  sku: string
  name: string
  brand?: string
  pack: string
  price: number
  vatCode: number
  confidence: number
  source: string
}

export interface ExtractionResult {
  items: ExtractedItem[]
  stats: {
    totalResponses: number
    jsonResponses: number
    productArrays: number
    extractedItems: number
    confidence: {
      high: number
      medium: number
      low: number
    }
  }
}

export class HarDataExtractor {
  private readonly PRODUCT_URL_PATTERNS = [
    /\/(api|graphql|products|catalog|prices|items|menu)/i,
    /product/i,
    /item/i,
    /catalog/i,
    /inventory/i
  ]

  private readonly PRODUCT_ARRAY_PATHS = [
    'items', 'products', 'data.items', 'data.products', 'results',
    'data.results', 'payload.items', 'response.data', 'menu.items'
  ]

  private readonly SKU_FIELDS = [
    'sku', 'code', 'id', 'itemCode', 'productCode', 'barcode', 'gtin'
  ]

  private readonly NAME_FIELDS = [
    'name', 'title', 'description', 'itemName', 'productName', 'Description'
  ]

  private readonly BRAND_FIELDS = [
    'brand', 'Brand', 'manufacturer', 'supplier', 'brandName'
  ]

  private readonly PACK_FIELDS = [
    'pack', 'unit', 'package', 'packaging', 'size', 'unitSize'
  ]

  private readonly PRICE_FIELDS = [
    'price_ex_vat', 'PriceExVAT', 'price', 'unitPrice', 'priceExVat',
    'cost', 'amount', 'pricePerUnit'
  ]

  private readonly VAT_FIELDS = [
    'vat_code', 'VATCode', 'vatCode', 'taxCode', 'tax_code'
  ]

  extract(har: any): ExtractionResult {
    const stats = {
      totalResponses: 0,
      jsonResponses: 0,
      productArrays: 0,
      extractedItems: 0,
      confidence: { high: 0, medium: 0, low: 0 }
    }

    const allItems: ExtractedItem[] = []
    const entries = har?.log?.entries || []

    for (const entry of entries) {
      stats.totalResponses++
      const mimeType = (entry?.response?.content?.mimeType || '').toLowerCase()
      const responseText = entry?.response?.content?.text

      if (mimeType.includes('application/json') && responseText) {
        stats.jsonResponses++
      }

      const extracted = this.extractFromEntry(entry)
      if (extracted.length > 0) {
        stats.productArrays++
        allItems.push(...extracted)
      }
    }

    // Deduplicate and validate
    const deduplicatedItems = this.deduplicateItems(allItems)
    const validatedItems = deduplicatedItems
      .map(item => this.validateAndEnhanceItem(item))
      .filter(item => item !== null) as ExtractedItem[]

    // Calculate confidence stats
    validatedItems.forEach(item => {
      if (item.confidence >= 0.8) stats.confidence.high++
      else if (item.confidence >= 0.5) stats.confidence.medium++
      else stats.confidence.low++
    })

    stats.extractedItems = validatedItems.length

    return {
      items: validatedItems,
      stats
    }
  }

  private extractFromEntry(entry: any): ExtractedItem[] {
    const url = entry?.request?.url || ''
    const mimeType = (entry?.response?.content?.mimeType || '').toLowerCase()
    const responseText = entry?.response?.content?.text

    // Skip non-JSON responses
    if (!mimeType.includes('application/json') || !responseText) {
      return []
    }

    // Check if URL looks like a product API
    const isProductUrl = this.PRODUCT_URL_PATTERNS.some(pattern => pattern.test(url))
    if (!isProductUrl) return []

    try {
      const data = JSON.parse(responseText)
      return this.extractItemsFromJson(data, url)
    } catch {
      return []
    }
  }

  private extractItemsFromJson(data: any, source: string): ExtractedItem[] {
    const items: ExtractedItem[] = []

    // Try different array paths
    for (const path of this.PRODUCT_ARRAY_PATHS) {
      const array = this.getNestedValue(data, path)
      if (Array.isArray(array) && array.length > 0) {
        array.forEach(item => {
          const extracted = this.extractItemFromObject(item, source)
          if (extracted) items.push(extracted)
        })
        break // Use first found array
      }
    }

    return items
  }

  private extractItemFromObject(obj: any, source: string): ExtractedItem | null {
    if (!obj || typeof obj !== 'object') return null

    const sku = this.findFieldValue(obj, this.SKU_FIELDS)
    const name = this.findFieldValue(obj, this.NAME_FIELDS)
    const brand = this.findFieldValue(obj, this.BRAND_FIELDS)
    const pack = this.findFieldValue(obj, this.PACK_FIELDS)
    const price = this.findNumericValue(obj, this.PRICE_FIELDS)
    const vatCode = this.findNumericValue(obj, this.VAT_FIELDS)

    // Must have at least SKU or name, and a price
    if ((!sku && !name) || !price || price <= 0) return null

    // Calculate confidence based on available fields
    let confidence = 0.3 // Base confidence
    if (sku) confidence += 0.3
    if (name) confidence += 0.2
    if (brand) confidence += 0.1
    if (pack) confidence += 0.1

    const result: ExtractedItem = {
      sku: String(sku || name || '').trim(),
      name: String(name || sku || '').trim(),
      pack: String(pack || '').trim(),
      price: Number(price),
      vatCode: Number(vatCode || 24),
      confidence,
      source
    }
    if (brand) {
      result.brand = String(brand).trim()
    }
    return result
  }

  private findFieldValue(obj: any, fieldNames: string[]): any {
    for (const field of fieldNames) {
      if (Object.prototype.hasOwnProperty.call(obj, field) && obj[field] != null && obj[field] !== '') {
        return obj[field]
      }
    }
    return null
  }

  private findNumericValue(obj: any, fieldNames: string[]): number | null {
    const value = this.findFieldValue(obj, fieldNames)
    if (value == null) return null
    
    const num = Number(value)
    return isNaN(num) ? null : num
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  private deduplicateItems(items: ExtractedItem[]): ExtractedItem[] {
    const seen = new Map<string, ExtractedItem>()
    
    items.forEach(item => {
      // Create dedup key from SKU and name
      const key = `${item.sku.toLowerCase()}_${item.name.toLowerCase()}`
      
      const existing = seen.get(key)
      if (!existing || item.confidence > existing.confidence) {
        seen.set(key, item)
      }
    })

    return Array.from(seen.values())
  }

  private validateAndEnhanceItem(item: ExtractedItem): ExtractedItem | null {
    // Basic validation
    if (!item.name || item.name.length < 2) return null
    if (!item.sku || item.sku.length < 1) return null
    if (item.price <= 0 || item.price > 1000000) return null

    // Enhance pack information
    const enhancedPack = this.enhancePackInfo(item.pack)
    
    // Validate VAT code
    const validVatCode = [11, 24].includes(item.vatCode) ? item.vatCode : 24

    const sanitized: ExtractedItem = {
      ...item,
      pack: enhancedPack,
      vatCode: validVatCode,
      name: item.name.trim(),
      sku: item.sku.trim()
    }
    if (item.brand) {
      sanitized.brand = item.brand.trim()
    }
    return sanitized
  }

  private enhancePackInfo(pack: string): string {
    if (!pack) return '1 each'
    
    const cleaned = pack.toLowerCase().trim()
    
    // Common pack format patterns
    const patterns = [
      /(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(l|kg|g|ml)/,
      /(\d+(?:[.,]\d+)?)\s*(l|kg|g|ml|pcs?|each)/,
      /(\d+)\s*(pcs?|pieces?|each)/
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) return pack // Keep original if it matches a known pattern
    }

    // Default fallback
    return pack || '1 each'
  }
}
