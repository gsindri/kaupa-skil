
-- Create delivery_rules table for supplier-specific fee structures
CREATE TABLE public.delivery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  zone VARCHAR(100) DEFAULT 'default',
  free_threshold_ex_vat DECIMAL(10,2),
  flat_fee DECIMAL(10,2) DEFAULT 0,
  fuel_surcharge_pct DECIMAL(5,3) DEFAULT 0,
  pallet_deposit_per_unit DECIMAL(10,2) DEFAULT 0,
  cutoff_time TIME,
  delivery_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Mon-Fri as default
  tiers_json JSONB DEFAULT '[]'::jsonb, -- For complex tier structures
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zones table for geographic delivery areas
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) DEFAULT 'IS',
  region VARCHAR(100),
  postal_codes TEXT[], -- Array of postal codes covered
  base_delivery_fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add delivery-related columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee_estimated DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee_actual DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.zones(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_optimization_used BOOLEAN DEFAULT false;

-- Add alternative suggestion tracking to order_lines
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS alt_suggestion_of UUID REFERENCES public.order_lines(id);
ALTER TABLE public.order_lines ADD COLUMN IF NOT EXISTS optimization_reason TEXT;

-- Create delivery analytics table
CREATE TABLE public.delivery_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  month DATE NOT NULL, -- First day of month
  total_deliveries INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(10,2) DEFAULT 0,
  orders_under_threshold INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, supplier_id, month)
);

-- Create indexes for performance
CREATE INDEX idx_delivery_rules_supplier ON public.delivery_rules(supplier_id);
CREATE INDEX idx_delivery_rules_zone ON public.delivery_rules(zone);
CREATE INDEX idx_zones_postal_codes ON public.zones USING GIN(postal_codes);
CREATE INDEX idx_delivery_analytics_tenant_month ON public.delivery_analytics(tenant_id, month);

-- Insert default zone for Iceland
INSERT INTO public.zones (name, country_code, region, base_delivery_fee)
VALUES ('Capital Area', 'IS', 'Reykjavik', 0)
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_rules
CREATE POLICY "Users can view delivery rules for their suppliers"
  ON public.delivery_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_suppliers ts
      JOIN public.memberships m ON m.tenant_id = ts.tenant_id
      WHERE ts.supplier_id = delivery_rules.supplier_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage delivery rules"
  ON public.delivery_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_suppliers ts
      JOIN public.memberships m ON m.tenant_id = ts.tenant_id
      WHERE ts.supplier_id = delivery_rules.supplier_id
      AND m.user_id = auth.uid()
      AND (m.base_role = 'owner' OR has_capability('manage_supplier_links', 'tenant', ts.tenant_id))
    )
  );

-- RLS policies for zones
CREATE POLICY "Users can view zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Platform admins can manage zones" ON public.zones FOR ALL USING (is_platform_admin());

-- RLS policies for delivery_analytics
CREATE POLICY "Tenant members can view their delivery analytics"
  ON public.delivery_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = delivery_analytics.tenant_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert delivery analytics"
  ON public.delivery_analytics FOR INSERT
  WITH CHECK (true);
