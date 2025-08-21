# Hardcode Inventory

The following tables list hardcoded demo data and mock implementations found in the codebase and database. Each entry identifies why it is a hardcode, the proposed source of truth, and suggested removal steps.

## Frontend

| Location | Snippet / Example | Why it's a hardcode | Proposed source of truth | Removal / Replacement Steps |
|---|---|---|---|---|
| `src/hooks/useComparisonItems.tsx` | `const mockItems: ComparisonItem[] = […]` | Product comparison uses static mock items and suppliers | `supplier_items`, `price_quotes` tables | Replace mock array with Supabase query using tenant‑scoped filters |
| `src/pages/Discovery.tsx` | `const mockSuppliers: SupplierCard[] = […]` | Supplier discovery uses hardcoded cards and sample products | `suppliers`, `supplier_items` | Query suppliers from DB; derive sample products from stock/price history |
| `src/lib/landedCost.ts` | `const mockSupplierRules: SupplierRule[] = […]` | Delivery fees calculated from demo rules | `delivery_rules` table | Fetch rule per supplier; move calculations to service that reads DB |
| `src/components/dashboard/RecentOrdersTable.tsx` | `const mockRecentOrders: RecentOrder[] = […]` | Dashboard orders summary uses fabricated records | `orders` table | Query recent orders for workspace; remove mock list |
| `src/components/dashboard/AlertsPanel.tsx` | `const mockAlerts: AlertItem[] = […]` | Alerts list populated with static examples | `alerts`/`price_history` | Fetch from alerts table; handle empty state when none |
| `src/components/dashboard/AnomaliesList.tsx` | `const mockAnomalies: Anomaly[] = […]` | Price/stock anomalies are mocked | `price_history`, anomaly detection job | Drive from analytics service results |
| `src/components/dashboard/SuppliersPanel.tsx` | `const mockSuppliers: Supplier[] = […]` | Supplier status panel uses fake entries | `suppliers`, `supplier_connections` | Query connected suppliers and sync status |
| `src/components/dashboard/LiveUpdates.tsx` | `const mockUpdates: UpdateItem[] = […]` | Live updates stream shows fabricated events | event log / `connector_runs` | Subscribe to real‑time channel or polling endpoint |
| `src/components/dashboard/ActivityList.tsx` | `const mockActivity: ActivityItem[] = […]` | Recent activity feed uses placeholder messages | audit log table | Fetch tenant audit log entries |
| `src/pages/Dashboard.tsx` | `const mockAnalyticsData` & `const mockAnomalies` | Analytics tab and alerts rely on hardcoded metrics | analytics views (`price_history`, `orders`) | Replace with queries to analytics API; show onboarding when empty |
| `src/components/compare/EnhancedComparisonTable.tsx` | `const mockCartItem: CartItem` | Delivery calculation built around synthetic cart item | real cart items table | Use actual cart context; remove mock wrapper |
| `src/components/quick/MiniCompareDrawer.tsx` | `const mockSupplierOptions = […]` | Supplier comparison drawer uses static supplier offers | `supplier_items`, `prices`, `delivery_rules` | Query top offers from DB; compute delivery impacts dynamically |
| `src/components/quick/PantryLanes.tsx` | `const mockFavorites = […]`, `const mockLastOrder = […]` | Favorites and last order lanes display demo items | `favorites`, `order_lines` | Fetch user favorites and last order lines; remove placeholder arrays |

## Database / Migrations

| Location | Snippet / Example | Why it's a hardcode | Proposed source of truth | Removal / Replacement Steps |
|---|---|---|---|---|
| `supabase/migrations/20250812165208_79d75377-0718-46c4-ae46-a086b1a517a6.sql` | Inserts units, categories, VAT rules, and demo suppliers | Demo rows ship with production migrations | Reference tables (`units`, `categories`, `vat_rules`) should remain; supplier data must come from onboarding | Remove supplier inserts from migration; keep lookup tables; move any dev-only seeds to separate script |
| `supabase/migrations/20250818181314_2ae84622-91f5-40ac-934b-75470704e237.sql` | Sample categories, suppliers, and supplier_items | Adds business data directly in migration | Production DB should be empty; data should arrive from connectors or onboarding | Delete sample inserts; provide dev seed script gated by flag |
| `supabase/migrations/20250814134332_74d9a40d-55ef-4254-b5da-376bd26a3148.sql` | Sample delivery rules for first three suppliers | Hardcodes logistics assumptions | `delivery_rules` table populated per supplier connection | Drop insert; require connector or admin input to create rules |

## Cleanup & Migration Plan

1. **Remove frontend mock arrays** and replace with React Query hooks that read from Supabase tables (`suppliers`, `supplier_items`, `prices`, `orders`, `alerts`, etc.). Display onboarding components when queries return empty.
2. **Drop demo rows** from production migrations and create a separate `dev:seed` script guarded by a `DEV_SAMPLE_DATA` flag so sample data never ships to prod.
3. **Add/verify tables** for real supplier feeds: `supplier_connections`, `products`, `product_variants`, `price_lists`, `prices`, `stock`, `price_history`, `catalog_mappings`.
4. **Tighten RLS** using `tenant_id` checks (e.g., `supplier.workspace_id = auth.jwt()->>'workspace_id'`) so tenants only view their own data.
5. **Implement ETL stubs** for real wholesalers: connectors ingest supplier catalogs and prices, normalize fields (SKU/EAN, pack size, unit, VAT, lead time), and write to `price_history` & `stock` with scheduled background jobs and retry logic.
6. **Use i18n keys and tenant-generated URLs** to eliminate demo copy and fixed routes. Show “Connect a supplier” onboarding for first-time users.

