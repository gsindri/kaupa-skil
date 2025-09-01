// Database types - embedded directly to avoid import issues
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          name: string
          connector_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          connector_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          connector_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      supplier_items: {
        Row: {
          id: string
          supplier_id: string
          display_name: string
          ext_sku: string
          brand: string | null
          pack_qty: number | null
          pack_unit_id: string | null
          vat_code: number | null
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          display_name: string
          ext_sku: string
          brand?: string | null
          pack_qty?: number | null
          pack_unit_id?: string | null
          vat_code?: number | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          display_name?: string
          ext_sku?: string
          brand?: string | null
          pack_qty?: number | null
          pack_unit_id?: string | null
          vat_code?: number | null
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplier_credentials: {
        Row: {
          id: string
          supplier_id: string
          tenant_id: string | null
          test_status: string | null
          encrypted_blob: string | null
          last_tested_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          tenant_id?: string | null
          test_status?: string | null
          encrypted_blob?: string | null
          last_tested_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          tenant_id?: string | null
          test_status?: string | null
          encrypted_blob?: string | null
          last_tested_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connector_runs: {
        Row: {
          id: string
          supplier_id: string
          tenant_id: string | null
          status: string
          connector_type: string | null
          started_at: string | null
          finished_at: string | null
          items_found: number | null
          prices_updated: number | null
          errors_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          tenant_id?: string | null
          status?: string
          connector_type?: string | null
          started_at?: string | null
          finished_at?: string | null
          items_found?: number | null
          prices_updated?: number | null
          errors_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          tenant_id?: string | null
          status?: string
          connector_type?: string | null
          started_at?: string | null
          finished_at?: string | null
          items_found?: number | null
          prices_updated?: number | null
          errors_count?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      price_quotes: {
        Row: {
          id: string
          supplier_item_id: string
          observed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          supplier_item_id: string
          observed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          supplier_item_id?: string
          observed_at?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          tenant_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_lines: {
        Row: {
          id: string
          order_id: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          tenant_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          kind: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          kind?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          base_role: string
          attrs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          base_role: string
          attrs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          base_role?: string
          attrs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      grants: {
        Row: {
          id: string
          membership_id: string
          tenant_id: string
          capability: string
          scope: string
          scope_id: string | null
          constraints: Json
          created_at: string
        }
        Insert: {
          id?: string
          membership_id: string
          tenant_id: string
          capability: string
          scope?: string
          scope_id?: string | null
          constraints?: Json
          created_at?: string
        }
        Update: {
          id?: string
          membership_id?: string
          tenant_id?: string
          capability?: string
          scope?: string
          scope_id?: string | null
          constraints?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

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
  image?: string
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