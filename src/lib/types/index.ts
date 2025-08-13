
// Consolidated types to prevent drift between database.ts and components
export type { Database } from './database'

// Re-export commonly used types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row'] 
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderLine = Database['public']['Tables']['order_lines']['Row']
export type SupplierItem = Database['public']['Tables']['supplier_items']['Row']
export type PriceQuote = Database['public']['Tables']['price_quotes']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']

// Cart item type that properly maps to database
export interface CartItem {
  id: string // This should be supplier_items.id
  supplierId: string
  supplierName: string
  itemName: string
  sku: string
  packSize: string
  packPrice: number
  unitPriceExVat: number
  unitPriceIncVat: number
  quantity: number
  vatRate: number
  unit: string
  // Add proper mapping fields
  supplierItemId: string // Maps to supplier_items.id for database
  displayName: string
  packQty: number
}

// Price comparison types
export interface ComparisonItem {
  id: string
  itemName: string
  brand: string | null
  category: string | null
  suppliers: SupplierQuote[]
}

export interface SupplierQuote {
  id: string
  name: string
  sku: string
  packSize: string
  packPrice: number
  unitPriceExVat: number
  unitPriceIncVat: number
  unit: string
  inStock: boolean
  lastUpdated: string
  vatCode: string
  priceHistory: number[]
  badge: 'best' | 'good' | 'expensive' | null
  supplierItemId: string // For proper database mapping
}
