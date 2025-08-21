
-- Create delivery_rules table with supplier-specific fee structures
CREATE TABLE IF NOT EXISTS public.delivery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  zone TEXT NOT NULL DEFAULT 'default',
  free_threshold_ex_vat DECIMAL(10,2),
  flat_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  fuel_surcharge_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  pallet_deposit_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  cutoff_time TIME,
  delivery_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  tiers_json JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zones table for geographic delivery areas
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'IS',
  region TEXT,
  postal_codes TEXT[] NOT NULL DEFAULT '{}',
  base_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_analytics table for tracking delivery costs
CREATE TABLE IF NOT EXISTS public.delivery_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  month DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  orders_under_threshold INTEGER NOT NULL DEFAULT 0,
  total_fees_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  potential_savings DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, supplier_id, month)
);

-- Add delivery fee columns to orders table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery_fee') THEN
    ALTER TABLE public.orders 
    ADD COLUMN estimated_delivery_fee DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN actual_delivery_fee DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN delivery_zone TEXT DEFAULT 'default';
  END IF;
END $$;

-- Create suppliers table if it doesn't exist (referenced by delivery_analytics)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for delivery_rules
CREATE POLICY "Users can view delivery rules for their suppliers" 
  ON public.delivery_rules 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s 
      JOIN public.memberships m ON m.tenant_id = s.tenant_id
      WHERE s.id = delivery_rules.supplier_id 
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage delivery rules" 
  ON public.delivery_rules 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s 
      JOIN public.memberships m ON m.tenant_id = s.tenant_id
      WHERE s.id = delivery_rules.supplier_id 
        AND m.user_id = auth.uid()
        AND (m.base_role = 'owner' OR has_capability('manage_supplier_links', 'tenant', s.tenant_id))
    )
  );

-- Create RLS policies for zones
CREATE POLICY "All users can view zones" 
  ON public.zones 
  FOR SELECT 
  USING (true);

-- Create RLS policies for delivery_analytics
CREATE POLICY "Tenant members can view their delivery analytics" 
  ON public.delivery_analytics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m 
      WHERE m.tenant_id = delivery_analytics.tenant_id 
        AND m.user_id = auth.uid()
    )
  );

-- Create RLS policies for suppliers
CREATE POLICY "Tenant members can view their suppliers" 
  ON public.suppliers 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m 
      WHERE m.tenant_id = suppliers.tenant_id 
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage suppliers" 
  ON public.suppliers 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m 
      WHERE m.tenant_id = suppliers.tenant_id 
        AND m.user_id = auth.uid()
        AND (m.base_role = 'owner' OR has_capability('manage_supplier_links', 'tenant', suppliers.tenant_id))
    )
  );

-- Create function for getting frequent items by supplier
CREATE OR REPLACE FUNCTION public.get_frequent_items_by_supplier(
  supplier_id_param UUID,
  days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
  supplier_item_id UUID,
  supplier_items JSONB,
  order_frequency BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ol.supplier_item_id,
    jsonb_build_object(
      'name', si.name,
      'pack_size', si.pack_size,
      'unit_price_ex_vat', si.unit_price_ex_vat,
      'unit_price_inc_vat', si.unit_price_inc_vat
    ) as supplier_items,
    COUNT(*) as order_frequency
  FROM public.order_lines ol
  JOIN public.supplier_items si ON si.id = ol.supplier_item_id
  WHERE ol.supplier_id = supplier_id_param
    AND ol.created_at >= (NOW() - (days_back || ' days')::interval)
    AND EXISTS (
      SELECT 1 FROM public.memberships m 
      JOIN public.suppliers s ON s.tenant_id = m.tenant_id
      WHERE s.id = ol.supplier_id 
        AND m.user_id = auth.uid()
    )
  GROUP BY ol.supplier_item_id, si.name, si.pack_size, si.unit_price_ex_vat, si.unit_price_inc_vat
  ORDER BY order_frequency DESC
  LIMIT 5;
$$;

-- Insert some default zones for Iceland
INSERT INTO public.zones (name, country_code, postal_codes, base_delivery_fee) VALUES
  ('Reykjavik Metro', 'IS', ARRAY['101', '102', '103', '104', '105', '107', '108', '109', '110', '111', '112', '113', '116', '121', '125', '127', '128', '129', '130', '132', '150', '155', '170', '172', '190', '200', '201', '202', '203', '210', '212', '225', '270'], 1500),
  ('Iceland - Other', 'IS', ARRAY[], 3500)
ON CONFLICT DO NOTHING;
