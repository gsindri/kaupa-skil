
// Import the Database type from the database types file
import { Database } from './database'

// Consolidated types to prevent drift between database.ts and components
export type { Database } from './database'

// Re-export commonly used types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row'] 
export type Order = any
export type OrderLine = any
export type SupplierItem = any
export type PriceQuote = any
export type Supplier = any

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
