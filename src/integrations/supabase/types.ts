export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_elevations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          meta_data: Json | null
          reason: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_settings: {
        Row: {
          id: string
          min_distinct_orgs: number
          min_orders_count: number
          updated_at: string
          updated_by: string | null
          winsor_lower_percentile: number
          winsor_upper_percentile: number
        }
        Insert: {
          id?: string
          min_distinct_orgs?: number
          min_orders_count?: number
          updated_at?: string
          updated_by?: string | null
          winsor_lower_percentile?: number
          winsor_upper_percentile?: number
        }
        Update: {
          id?: string
          min_distinct_orgs?: number
          min_orders_count?: number
          updated_at?: string
          updated_by?: string | null
          winsor_lower_percentile?: number
          winsor_upper_percentile?: number
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product: {
        Row: {
          base_qty_per_pack: number | null
          base_uom: string | null
          brand: string | null
          created_at: string
          gtin: string | null
          id: string
          name: string
          pack_composition: string | null
          size: string | null
          updated_at: string
        }
        Insert: {
          base_qty_per_pack?: number | null
          base_uom?: string | null
          brand?: string | null
          created_at?: string
          gtin?: string | null
          id?: string
          name: string
          pack_composition?: string | null
          size?: string | null
          updated_at?: string
        }
        Update: {
          base_qty_per_pack?: number | null
          base_uom?: string | null
          brand?: string | null
          created_at?: string
          gtin?: string | null
          id?: string
          name?: string
          pack_composition?: string | null
          size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_is: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_is?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_is?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          capability: string
          constraints: Json | null
          created_at: string | null
          id: string
          membership_id: string
          scope: string
          scope_id: string | null
          tenant_id: string
        }
        Insert: {
          capability: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id: string
          scope?: string
          scope_id?: string | null
          tenant_id: string
        }
        Update: {
          capability?: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id?: string
          scope?: string
          scope_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          job_id: string
          level: string
          message: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id: string
          level: string
          message: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          requested_by: string | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          attrs: Json | null
          base_role: string
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attrs?: Json | null
          base_role: string
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attrs?: Json | null
          base_role?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          base_units_ordered: number | null
          catalog_product_id: string | null
          created_at: string
          currency: string
          id: string
          kr_per_base_unit: number | null
          line_total: number
          order_id: string
          pack_size: string | null
          quantity_packs: number
          supplier_product_id: string | null
          unit_price_per_pack: number
          vat_included: boolean
        }
        Insert: {
          base_units_ordered?: number | null
          catalog_product_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          kr_per_base_unit?: number | null
          line_total: number
          order_id: string
          pack_size?: string | null
          quantity_packs: number
          supplier_product_id?: string | null
          unit_price_per_pack: number
          vat_included?: boolean
        }
        Update: {
          base_units_ordered?: number | null
          catalog_product_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          kr_per_base_unit?: number | null
          line_total?: number
          order_id?: string
          pack_size?: string | null
          quantity_packs?: number
          supplier_product_id?: string | null
          unit_price_per_pack?: number
          vat_included?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalog"
            referencedColumns: ["catalog_id"]
          },
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_product"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          delivery_date: string | null
          id: string
          order_date: string
          order_number: string | null
          status: string
          supplier_id: string
          tenant_id: string
          updated_at: string
          vat_included: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_date?: string | null
          id?: string
          order_date: string
          order_number?: string | null
          status?: string
          supplier_id: string
          tenant_id: string
          updated_at?: string
          vat_included?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_date?: string | null
          id?: string
          order_date?: string
          order_number?: string | null
          status?: string
          supplier_id?: string
          tenant_id?: string
          updated_at?: string
          vat_included?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admin_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          reason: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requester_id: string
          target_entity_id: string | null
          target_entity_type: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      price_benchmarks: {
        Row: {
          avg_kr_per_unit: number | null
          benchmark_month: string
          catalog_product_id: string
          computed_at: string
          distinct_orgs_count: number | null
          id: string
          is_displayable: boolean
          median_kr_per_unit: number | null
          orders_count: number | null
          p25_kr_per_unit: number | null
          p75_kr_per_unit: number | null
          settings_snapshot: Json | null
          stddev_kr_per_unit: number | null
          supplier_id: string
          total_base_units: number | null
          winsor_applied: boolean
        }
        Insert: {
          avg_kr_per_unit?: number | null
          benchmark_month: string
          catalog_product_id: string
          computed_at?: string
          distinct_orgs_count?: number | null
          id?: string
          is_displayable?: boolean
          median_kr_per_unit?: number | null
          orders_count?: number | null
          p25_kr_per_unit?: number | null
          p75_kr_per_unit?: number | null
          settings_snapshot?: Json | null
          stddev_kr_per_unit?: number | null
          supplier_id: string
          total_base_units?: number | null
          winsor_applied?: boolean
        }
        Update: {
          avg_kr_per_unit?: number | null
          benchmark_month?: string
          catalog_product_id?: string
          computed_at?: string
          distinct_orgs_count?: number | null
          id?: string
          is_displayable?: boolean
          median_kr_per_unit?: number | null
          orders_count?: number | null
          p25_kr_per_unit?: number | null
          p75_kr_per_unit?: number | null
          settings_snapshot?: Json | null
          stddev_kr_per_unit?: number | null
          supplier_id?: string
          total_base_units?: number | null
          winsor_applied?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "price_benchmarks_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_benchmarks_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalog"
            referencedColumns: ["catalog_id"]
          },
          {
            foreignKeyName: "price_benchmarks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          gmail_access_token: string | null
          gmail_authorized: boolean | null
          gmail_refresh_token: string | null
          gmail_token_expires_at: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gmail_access_token?: string | null
          gmail_authorized?: boolean | null
          gmail_refresh_token?: string | null
          gmail_token_expires_at?: string | null
          id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gmail_access_token?: string | null
          gmail_authorized?: boolean | null
          gmail_refresh_token?: string | null
          gmail_token_expires_at?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_categories: {
        Row: {
          category_id: string
          created_at: string | null
          supplier_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          supplier_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_categories_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_credentials: {
        Row: {
          created_at: string | null
          encrypted_credentials: string
          id: string
          last_tested_at: string | null
          supplier_id: string
          tenant_id: string | null
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_credentials: string
          id?: string
          last_tested_at?: string | null
          supplier_id: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_credentials?: string
          id?: string
          last_tested_at?: string | null
          supplier_id?: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product: {
        Row: {
          active_status: string | null
          availability_text: string | null
          catalog_product_id: string | null
          category_path: string[] | null
          created_at: string
          data_provenance: string | null
          delisted_reason: string | null
          first_seen_at: string
          id: string
          image_url: string | null
          last_seen_at: string
          pack_size: string | null
          provenance_confidence: number | null
          raw_hash: string | null
          source_url: string | null
          stale_since: string | null
          supplier_base_qty: number | null
          supplier_id: string
          supplier_sku: string
          supplier_uom: string | null
          updated_at: string
        }
        Insert: {
          active_status?: string | null
          availability_text?: string | null
          catalog_product_id?: string | null
          category_path?: string[] | null
          created_at?: string
          data_provenance?: string | null
          delisted_reason?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          pack_size?: string | null
          provenance_confidence?: number | null
          raw_hash?: string | null
          source_url?: string | null
          stale_since?: string | null
          supplier_base_qty?: number | null
          supplier_id: string
          supplier_sku: string
          supplier_uom?: string | null
          updated_at?: string
        }
        Update: {
          active_status?: string | null
          availability_text?: string | null
          catalog_product_id?: string | null
          category_path?: string[] | null
          created_at?: string
          data_provenance?: string | null
          delisted_reason?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          pack_size?: string | null
          provenance_confidence?: number | null
          raw_hash?: string | null
          source_url?: string | null
          stale_since?: string | null
          supplier_base_qty?: number | null
          supplier_id?: string
          supplier_sku?: string
          supplier_uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalog"
            referencedColumns: ["catalog_id"]
          },
        ]
      }
      supplier_product_availability: {
        Row: {
          note: string | null
          qty: number | null
          status: Database["public"]["Enums"]["availability_status"]
          supplier_product_id: string
          updated_at: string
        }
        Insert: {
          note?: string | null
          qty?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          supplier_product_id: string
          updated_at?: string
        }
        Update: {
          note?: string | null
          qty?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          supplier_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_availability_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: true
            referencedRelation: "supplier_product"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          aggregation_opt_out_date: string | null
          allow_price_aggregation: boolean | null
          avg_lead_time_days: number | null
          badges: string[] | null
          contact_email: string | null
          contact_phone: string | null
          coverage_areas: string[] | null
          created_at: string | null
          display_name: string | null
          id: string
          is_featured: boolean | null
          kennitala: string | null
          legal_name: string | null
          logo_url: string | null
          min_order_isk: number | null
          name: string
          order_email: string | null
          short_description: string | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          aggregation_opt_out_date?: string | null
          allow_price_aggregation?: boolean | null
          avg_lead_time_days?: number | null
          badges?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_featured?: boolean | null
          kennitala?: string | null
          legal_name?: string | null
          logo_url?: string | null
          min_order_isk?: number | null
          name: string
          order_email?: string | null
          short_description?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          aggregation_opt_out_date?: string | null
          allow_price_aggregation?: boolean | null
          avg_lead_time_days?: number | null
          badges?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_featured?: boolean | null
          kennitala?: string | null
          legal_name?: string | null
          logo_url?: string | null
          min_order_isk?: number | null
          name?: string
          order_email?: string | null
          short_description?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      support_sessions: {
        Row: {
          actor_id: string
          created_at: string | null
          ends_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string | null
          tenant_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          ends_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          ends_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          kind: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          kind?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_public_catalog: {
        Row: {
          active_supplier_count: number | null
          availability_status: string | null
          availability_text: string | null
          availability_updated_at: string | null
          best_price: number | null
          brand: string | null
          canonical_pack: string | null
          catalog_id: string | null
          category_tags: string[] | null
          gtin: string | null
          name: string | null
          on_special: boolean | null
          pack_sizes: string[] | null
          sample_image_url: string | null
          sample_source_url: string | null
          size: string | null
          supplier_ids: string[] | null
          supplier_logo_urls: string[] | null
          supplier_names: string[] | null
          suppliers_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_password_strength: {
        Args: { password_text: string }
        Returns: boolean
      }
      compute_kr_per_base_unit: {
        Args: {
          base_qty_per_pack_val: number
          currency_val: string
          line_total_val: number
          quantity_packs_val: number
          vat_included_val: boolean
        }
        Returns: number
      }
      compute_monthly_benchmarks: {
        Args: { target_month: string }
        Returns: {
          displayable_count: number
          processed_count: number
          skipped_count: number
        }[]
      }
      create_elevation: {
        Args: { duration_minutes?: number; reason_text: string }
        Returns: string
      }
      create_support_session: {
        Args: {
          duration_minutes?: number
          reason_text: string
          target_tenant_id: string
        }
        Returns: string
      }
      decrypt_credential_data: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      derive_availability_status: {
        Args: { availability_text: string }
        Returns: string
      }
      encrypt_credential_data: {
        Args: { credential_data: Json }
        Returns: string
      }
      fetch_catalog_facets: {
        Args: {
          _availability?: string[]
          _brands?: string[]
          _category_ids?: string[]
          _pack_size_ranges?: string[]
          _search?: string
          _supplier_ids?: string[]
        }
        Returns: {
          count: number
          facet: string
          id: string
          name: string
        }[]
      }
      get_user_memberships: {
        Args: Record<PropertyKey, never>
        Returns: {
          attrs: Json
          base_role: string
          membership_id: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_active_elevation: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_capability: {
        Args: {
          cap: string
          target_id?: string
          target_scope: string
          want?: Json
        }
        Returns: boolean
      }
      has_support_session: {
        Args: { target_tenant: string }
        Returns: boolean
      }
      is_owner: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_name: string
          entity_id_val?: string
          entity_type_name?: string
          meta_data_val?: Json
          reason_text?: string
          tenant_id_val?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: { details?: Json; event_type: string }
        Returns: undefined
      }
      mark_stale_supplier_products: {
        Args: { _days?: number }
        Returns: undefined
      }
      revoke_elevation: {
        Args: { elevation_id: string }
        Returns: boolean
      }
      search_suppliers: {
        Args: {
          category_ids?: string[]
          featured_only?: boolean
          limit_count?: number
          min_rating?: number
          offset_count?: number
          search_query?: string
        }
        Returns: {
          avg_lead_time_days: number
          badges: string[]
          categories: Json
          contact_email: string
          contact_phone: string
          coverage_areas: string[]
          display_name: string
          id: string
          is_featured: boolean
          kennitala: string
          legal_name: string
          logo_url: string
          min_order_isk: number
          name: string
          short_description: string
          similarity_score: number
          verification_status: string
          website: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_initial_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      setup_owner_grants: {
        Args: { _membership_id: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      trigger_benchmark_computation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      v_org_catalog: {
        Args: { _org: string }
        Returns: {
          active_supplier_count: number
          availability_status: string
          availability_text: string
          availability_updated_at: string
          best_price: number
          brand: string
          canonical_pack: string
          catalog_id: string
          category_tags: string[]
          is_my_supplier: boolean
          name: string
          on_special: boolean
          pack_sizes: string[]
          sample_image_url: string
          sample_source_url: string
          supplier_ids: string[]
          supplier_logo_urls: string[]
          supplier_names: string[]
          suppliers_count: number
        }[]
      }
    }
    Enums: {
      availability_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_status: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "UNKNOWN"],
    },
  },
} as const
