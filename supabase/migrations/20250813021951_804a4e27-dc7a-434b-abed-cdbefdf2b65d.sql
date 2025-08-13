
-- Create missing core tables for the multi-tenant purchasing system

-- Create units table for measurement units
CREATE TABLE IF NOT EXISTS public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  base_unit TEXT,
  conversion_factor DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table for item categorization
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  vat_code TEXT NOT NULL DEFAULT 'STANDARD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create VAT rules table
CREATE TABLE IF NOT EXISTS public.vat_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  rate DECIMAL NOT NULL CHECK (rate >= 0 AND rate <= 1),
  category_id UUID REFERENCES public.categories(id),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create items table for master item catalog
CREATE TABLE IF NOT EXISTS public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category_id UUID REFERENCES public.categories(id),
  default_unit_id UUID REFERENCES public.units(id),
  ean TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table (already exists but ensure proper structure)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  ordering_email TEXT,
  website TEXT,
  connector_type TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_credentials table for encrypted API credentials
CREATE TABLE IF NOT EXISTS public.supplier_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  encrypted_blob TEXT NOT NULL,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, supplier_id)
);

-- Update supplier_items table structure
ALTER TABLE public.supplier_items 
  ADD COLUMN IF NOT EXISTS pack_unit_id UUID REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS yield_pct DECIMAL DEFAULT 1.0 CHECK (yield_pct > 0 AND yield_pct <= 1);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_lines table
CREATE TABLE IF NOT EXISTS public.order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_item_id UUID REFERENCES public.supplier_items(id),
  qty_packs DECIMAL NOT NULL CHECK (qty_packs > 0),
  pack_price DECIMAL NOT NULL CHECK (pack_price >= 0),
  unit_price_ex_vat DECIMAL CHECK (unit_price_ex_vat >= 0),
  unit_price_inc_vat DECIMAL CHECK (unit_price_inc_vat >= 0),
  vat_rate DECIMAL CHECK (vat_rate >= 0 AND vat_rate <= 1),
  line_total DECIMAL CHECK (line_total >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create connector_runs table for tracking ingestion processes
CREATE TABLE IF NOT EXISTS public.connector_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  connector_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  items_found INTEGER DEFAULT 0,
  prices_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  log_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for units (global read, admin write)
CREATE POLICY "Anyone can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Only admins can manage units" ON public.units FOR ALL USING (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
);

-- Create RLS policies for categories (global read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
);

-- Create RLS policies for vat_rules (global read, admin write)
CREATE POLICY "Anyone can view vat rules" ON public.vat_rules FOR SELECT USING (true);
CREATE POLICY "Only admins can manage vat rules" ON public.vat_rules FOR ALL USING (
  has_capability('manage_vat_rules', 'tenant')
) WITH CHECK (
  has_capability('manage_vat_rules', 'tenant')
);

-- Create RLS policies for items (global read, admin write)
CREATE POLICY "Anyone can view items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Only admins can manage items" ON public.items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND base_role IN ('owner', 'admin'))
);

-- Create RLS policies for supplier_credentials (tenant-scoped)
CREATE POLICY "Users can view their tenant credentials" ON public.supplier_credentials 
  FOR SELECT USING (
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

CREATE POLICY "Users can manage credentials with permission" ON public.supplier_credentials 
  FOR ALL USING (
    has_capability('manage_credentials', 'tenant', tenant_id)
  ) WITH CHECK (
    has_capability('manage_credentials', 'tenant', tenant_id)
  );

-- Create RLS policies for orders (tenant-scoped)
CREATE POLICY "Users can view their tenant orders" ON public.orders 
  FOR SELECT USING (
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

CREATE POLICY "Users can create orders with permission" ON public.orders 
  FOR INSERT WITH CHECK (
    has_capability('compose_order', 'tenant', tenant_id) AND
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

CREATE POLICY "Users can update their tenant orders" ON public.orders 
  FOR UPDATE USING (
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  ) WITH CHECK (
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

-- Create RLS policies for order_lines (through order relationship)
CREATE POLICY "Users can view order lines for their tenant orders" ON public.order_lines 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_lines.order_id 
      AND o.tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage order lines for their tenant orders" ON public.order_lines 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_lines.order_id 
      AND o.tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_lines.order_id 
      AND o.tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
    )
  );

-- Create RLS policies for connector_runs (tenant-scoped)
CREATE POLICY "Users can view their tenant connector runs" ON public.connector_runs 
  FOR SELECT USING (
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

CREATE POLICY "Users can create connector runs with permission" ON public.connector_runs 
  FOR INSERT WITH CHECK (
    has_capability('run_ingestion', 'tenant', tenant_id) AND
    tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_vat_rules_code ON public.vat_rules(code);
CREATE INDEX IF NOT EXISTS idx_vat_rules_valid_dates ON public.vat_rules(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_ean ON public.items(ean);
CREATE INDEX IF NOT EXISTS idx_supplier_credentials_tenant_supplier ON public.supplier_credentials(tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON public.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_supplier_id ON public.order_lines(supplier_id);
CREATE INDEX IF NOT EXISTS idx_connector_runs_tenant_id ON public.connector_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_runs_supplier_id ON public.connector_runs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_connector_runs_status ON public.connector_runs(status);

-- Insert basic data for units and VAT rules
INSERT INTO public.units (code, name, base_unit, conversion_factor) VALUES
  ('ea', 'Each', NULL, NULL),
  ('kg', 'Kilogram', NULL, NULL),
  ('g', 'Gram', 'kg', 0.001),
  ('l', 'Liter', NULL, NULL),
  ('ml', 'Milliliter', 'l', 0.001),
  ('m', 'Meter', NULL, NULL),
  ('cm', 'Centimeter', 'm', 0.01),
  ('box', 'Box', NULL, NULL),
  ('pack', 'Pack', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.categories (name, vat_code) VALUES
  ('Food & Beverages', 'STANDARD'),
  ('Cleaning Supplies', 'STANDARD'),
  ('Office Supplies', 'STANDARD'),
  ('Kitchen Equipment', 'STANDARD'),
  ('Disposables', 'STANDARD')
ON CONFLICT DO NOTHING;

INSERT INTO public.vat_rules (code, rate) VALUES
  ('STANDARD', 0.24),
  ('REDUCED', 0.11),
  ('ZERO', 0.0)
ON CONFLICT (code) DO NOTHING;

-- Harden security by updating function search paths
ALTER FUNCTION public.has_capability(text, text, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.get_user_memberships() SET search_path = public;
ALTER FUNCTION public.is_owner(uuid) SET search_path = public;
ALTER FUNCTION public.setup_owner_grants(uuid) SET search_path = public;
