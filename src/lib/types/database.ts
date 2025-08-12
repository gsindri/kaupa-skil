export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          domain: string | null
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string | null
          email: string
          full_name: string | null
          role: 'admin' | 'buyer' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          email: string
          full_name?: string | null
          role?: 'admin' | 'buyer' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          email?: string
          full_name?: string | null
          role?: 'admin' | 'buyer' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          base_role: 'owner' | 'admin' | 'member'
          attrs: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          base_role: 'owner' | 'admin' | 'member'
          attrs?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          base_role?: 'owner' | 'admin' | 'member'
          attrs?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      grants: {
        Row: {
          id: string
          tenant_id: string
          membership_id: string
          capability: string
          scope: 'tenant' | 'relationship' | 'supplier'
          scope_id: string | null
          constraints: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          membership_id: string
          capability: string
          scope?: 'tenant' | 'relationship' | 'supplier'
          scope_id?: string | null
          constraints?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          membership_id?: string
          capability?: string
          scope?: 'tenant' | 'relationship' | 'supplier'
          scope_id?: string | null
          constraints?: Record<string, any>
          created_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          ordering_email: string | null
          website: string | null
          connector_type: string | null
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          ordering_email?: string | null
          website?: string | null
          connector_type?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string | null
          ordering_email?: string | null
          website?: string | null
          connector_type?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      supplier_credentials: {
        Row: {
          id: string
          tenant_id: string
          supplier_id: string
          encrypted_blob: string
          last_tested_at: string | null
          test_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_id: string
          encrypted_blob: string
          last_tested_at?: string | null
          test_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_id?: string
          encrypted_blob?: string
          last_tested_at?: string | null
          test_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          code: string
          name: string
          base_unit: string | null
          conversion_factor: number | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          base_unit?: string | null
          conversion_factor?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          base_unit?: string | null
          conversion_factor?: number | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          vat_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          vat_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          vat_code?: string
          created_at?: string
        }
      }
      vat_rules: {
        Row: {
          id: string
          code: string
          rate: number
          category_id: string | null
          valid_from: string
          valid_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          rate: number
          category_id?: string | null
          valid_from?: string
          valid_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          rate?: number
          category_id?: string | null
          valid_from?: string
          valid_to?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          brand: string | null
          category_id: string | null
          default_unit_id: string | null
          ean: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          category_id?: string | null
          default_unit_id?: string | null
          ean?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          category_id?: string | null
          default_unit_id?: string | null
          ean?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplier_items: {
        Row: {
          id: string
          supplier_id: string
          ext_sku: string
          ean: string | null
          display_name: string
          pack_qty: number
          pack_unit_id: string | null
          yield_pct: number
          category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          ext_sku: string
          ean?: string | null
          display_name: string
          pack_qty?: number
          pack_unit_id?: string | null
          yield_pct?: number
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          ext_sku?: string
          ean?: string | null
          display_name?: string
          pack_qty?: number
          pack_unit_id?: string | null
          yield_pct?: number
          category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_quotes: {
        Row: {
          id: string
          supplier_item_id: string
          observed_at: string
          pack_price: number
          currency: string
          vat_code: string
          unit_price_ex_vat: number | null
          unit_price_inc_vat: number | null
          source: string | null
          connector_run_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supplier_item_id: string
          observed_at?: string
          pack_price: number
          currency?: string
          vat_code?: string
          unit_price_ex_vat?: number | null
          unit_price_inc_vat?: number | null
          source?: string | null
          connector_run_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supplier_item_id?: string
          observed_at?: string
          pack_price?: number
          currency?: string
          vat_code?: string
          unit_price_ex_vat?: number | null
          unit_price_inc_vat?: number | null
          source?: string | null
          connector_run_id?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          tenant_id: string
          created_by: string | null
          status: 'draft' | 'submitted' | 'confirmed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          created_by?: string | null
          status?: 'draft' | 'submitted' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          created_by?: string | null
          status?: 'draft' | 'submitted' | 'confirmed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_lines: {
        Row: {
          id: string
          order_id: string
          supplier_id: string | null
          supplier_item_id: string | null
          qty_packs: number
          pack_price: number
          unit_price_ex_vat: number | null
          unit_price_inc_vat: number | null
          vat_rate: number | null
          line_total: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          supplier_id?: string | null
          supplier_item_id?: string | null
          qty_packs: number
          pack_price: number
          unit_price_ex_vat?: number | null
          unit_price_inc_vat?: number | null
          vat_rate?: number | null
          line_total?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          supplier_id?: string | null
          supplier_item_id?: string | null
          qty_packs?: number
          pack_price?: number
          unit_price_ex_vat?: number | null
          unit_price_inc_vat?: number | null
          vat_rate?: number | null
          line_total?: number | null
          created_at?: string
        }
      }
      connector_runs: {
        Row: {
          id: string
          tenant_id: string
          supplier_id: string | null
          connector_type: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          started_at: string
          finished_at: string | null
          items_found: number
          prices_updated: number
          errors_count: number
          log_data: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_id?: string | null
          connector_type: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string
          finished_at?: string | null
          items_found?: number
          prices_updated?: number
          errors_count?: number
          log_data?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_id?: string | null
          connector_type?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string
          finished_at?: string | null
          items_found?: number
          prices_updated?: number
          errors_count?: number
          log_data?: Record<string, any>
          created_at?: string
        }
      }
    }
    Functions: {
      has_capability: {
        Args: {
          cap: string
          target_scope: string
          target_id?: string
          want?: Record<string, any>
        }
        Returns: boolean
      }
      get_user_memberships: {
        Args: {}
        Returns: {
          membership_id: string
          tenant_id: string
          tenant_name: string
          base_role: string
          attrs: Record<string, any>
        }[]
      }
    }
  }
}
