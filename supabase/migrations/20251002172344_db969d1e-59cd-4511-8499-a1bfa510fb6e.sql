-- Phase 1: Price Benchmarking Foundation

-- =====================================================
-- 1.1 Product Normalization Schema
-- =====================================================

-- Add canonical unit fields to catalog_product for price comparison
ALTER TABLE catalog_product 
ADD COLUMN IF NOT EXISTS base_uom TEXT,
ADD COLUMN IF NOT EXISTS base_qty_per_pack NUMERIC,
ADD COLUMN IF NOT EXISTS pack_composition TEXT;

COMMENT ON COLUMN catalog_product.base_uom IS 'Canonical unit of measure (kg, l, unit, etc.) for price comparison';
COMMENT ON COLUMN catalog_product.base_qty_per_pack IS 'Number of base units per pack (e.g., 6.0 for 6×1kg)';
COMMENT ON COLUMN catalog_product.pack_composition IS 'Human-readable pack composition (e.g., "6 × 1 kg")';

-- Add supplier-specific pack info to supplier_product
ALTER TABLE supplier_product 
ADD COLUMN IF NOT EXISTS supplier_base_qty NUMERIC,
ADD COLUMN IF NOT EXISTS supplier_uom TEXT;

-- =====================================================
-- 1.2 Orders & Transaction Schema
-- =====================================================

-- Purchase orders (buyer → supplier)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  order_date TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'ISK',
  vat_included BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_product_id UUID REFERENCES supplier_product(id),
  catalog_product_id UUID REFERENCES catalog_product(id),
  quantity_packs NUMERIC NOT NULL,
  pack_size TEXT,
  unit_price_per_pack NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ISK',
  vat_included BOOLEAN NOT NULL DEFAULT true,
  kr_per_base_unit NUMERIC,
  base_units_ordered NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_orders_tenant_date ON orders(tenant_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id, order_date);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(catalog_product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_supplier_product ON order_lines(supplier_product_id);

-- =====================================================
-- 1.3 Price Normalization Logic
-- =====================================================

-- Function to compute normalized price (kr per base unit)
CREATE OR REPLACE FUNCTION compute_kr_per_base_unit(
  line_total_val NUMERIC,
  quantity_packs_val NUMERIC,
  base_qty_per_pack_val NUMERIC,
  currency_val TEXT,
  vat_included_val BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
  kr_amount NUMERIC;
  total_base_units NUMERIC;
BEGIN
  -- Convert to ISK if needed (currently only supports ISK)
  IF currency_val = 'ISK' THEN
    kr_amount := line_total_val;
  ELSE
    -- For now, reject non-ISK currencies
    RAISE EXCEPTION 'Currency conversion not yet supported: %', currency_val;
  END IF;
  
  -- Normalize VAT (platform standard: exclude VAT)
  IF vat_included_val THEN
    kr_amount := kr_amount / 1.24; -- Iceland VAT is 24%
  END IF;
  
  -- Calculate total base units
  total_base_units := quantity_packs_val * base_qty_per_pack_val;
  
  IF total_base_units = 0 OR total_base_units IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN kr_amount / total_base_units;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-populate computed fields on order_lines
CREATE OR REPLACE FUNCTION populate_order_line_computed_fields()
RETURNS TRIGGER AS $$
DECLARE
  base_qty NUMERIC;
BEGIN
  -- Get base_qty_per_pack from catalog_product
  IF NEW.catalog_product_id IS NOT NULL THEN
    SELECT base_qty_per_pack INTO base_qty
    FROM catalog_product
    WHERE id = NEW.catalog_product_id;
    
    IF base_qty IS NULL OR base_qty = 0 THEN
      -- Don't block the insert, just log warning
      RAISE WARNING 'Product % missing base_qty_per_pack, skipping price normalization', NEW.catalog_product_id;
      RETURN NEW;
    END IF;
    
    -- Compute normalized price
    NEW.kr_per_base_unit := compute_kr_per_base_unit(
      NEW.line_total,
      NEW.quantity_packs,
      base_qty,
      NEW.currency,
      NEW.vat_included
    );
    
    NEW.base_units_ordered := NEW.quantity_packs * base_qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to compute before insert/update
DROP TRIGGER IF EXISTS order_line_compute_before_insert ON order_lines;
CREATE TRIGGER order_line_compute_before_insert
  BEFORE INSERT OR UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION populate_order_line_computed_fields();

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- Orders policies: tenant members can view/manage their tenant's orders
CREATE POLICY "Tenant members can view their tenant orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = orders.tenant_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can insert orders for their tenant"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = orders.tenant_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can update their tenant orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = orders.tenant_id
      AND m.user_id = auth.uid()
    )
  );

-- Order lines policies: accessible through parent order
CREATE POLICY "Users can view order lines for accessible orders"
  ON order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_lines.order_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order lines for accessible orders"
  ON order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_lines.order_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update order lines for accessible orders"
  ON order_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_lines.order_id
      AND m.user_id = auth.uid()
    )
  );