
import { Database } from './database'

export type Membership = Database['public']['Tables']['memberships']['Row']
export type Grant = Database['public']['Tables']['grants']['Row']

export type BaseRole = 'owner' | 'admin' | 'member'
export type Capability = 
  // Core buyer-side capabilities
  | 'view_prices'
  | 'compose_order'
  | 'dispatch_order_email'
  | 'run_ingestion'
  | 'manage_credentials'
  | 'manage_supplier_links'
  | 'view_price_history'
  | 'read_reports'
  | 'approve_order'
  // Core supplier-side capabilities
  | 'manage_catalog'
  | 'update_price_quotes'
  | 'view_relationship_orders'
  | 'acknowledge_order'
  | 'view_invoices'
  | 'manage_integrations'
  // Admin capabilities
  | 'manage_tenant_users'
  | 'manage_vat_rules'
  | 'read_audit_logs'

export type PermissionScope = 'tenant' | 'relationship' | 'supplier' | 'personal'

export interface GrantInput {
  capability: Capability
  scope: PermissionScope
  scope_id?: string | null
  constraints?: Record<string, any>
}

export interface UserMembership {
  membership_id: string
  tenant_id: string
  tenant_name: string
  base_role: BaseRole
  attrs: Record<string, any>
}

// Permission pack templates for easy assignment
export interface PermissionPack {
  name: string
  description: string
  grants: GrantInput[]
}

export const PERMISSION_PACKS: Record<string, PermissionPack> = {
  purchaser: {
    name: 'Purchaser',
    description: 'Can view prices and create orders',
    grants: [
      { capability: 'view_prices', scope: 'tenant' },
      { capability: 'compose_order', scope: 'tenant' },
      { capability: 'dispatch_order_email', scope: 'tenant' }
    ]
  },
  approver_200k: {
    name: 'Approver (200k ISK)',
    description: 'Can approve orders up to 200,000 ISK',
    grants: [
      { 
        capability: 'approve_order', 
        scope: 'tenant',
        constraints: { approval_limit_isk: 200000 }
      }
    ]
  },
  analyst: {
    name: 'Analyst',
    description: 'Can view reports and price history',
    grants: [
      { capability: 'view_price_history', scope: 'tenant' },
      { capability: 'read_reports', scope: 'tenant' },
      { capability: 'view_prices', scope: 'tenant' }
    ]
  },
  supplier_manager: {
    name: 'Supplier Manager',
    description: 'Can manage supplier relationships and credentials',
    grants: [
      { capability: 'manage_supplier_links', scope: 'tenant' },
      { capability: 'manage_credentials', scope: 'tenant' },
      { capability: 'run_ingestion', scope: 'tenant' }
    ]
  }
}

export const CAPABILITY_LABELS: Record<Capability, string> = {
  // Buyer capabilities
  view_prices: 'View Prices',
  compose_order: 'Compose Orders',
  dispatch_order_email: 'Send Order Emails',
  run_ingestion: 'Run Price Ingestion',
  manage_credentials: 'Manage Supplier Credentials',
  manage_supplier_links: 'Manage Supplier Links',
  view_price_history: 'View Price History',
  read_reports: 'Read Reports',
  approve_order: 'Approve Orders',
  // Supplier capabilities
  manage_catalog: 'Manage Catalog',
  update_price_quotes: 'Update Price Quotes',
  view_relationship_orders: 'View Orders',
  acknowledge_order: 'Acknowledge Orders',
  view_invoices: 'View Invoices',
  manage_integrations: 'Manage Integrations',
  // Admin capabilities
  manage_tenant_users: 'Manage Users',
  manage_vat_rules: 'Manage VAT Rules',
  read_audit_logs: 'Read Audit Logs'
}
