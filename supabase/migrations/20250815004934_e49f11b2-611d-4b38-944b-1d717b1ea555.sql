
-- Create delivery_rules table for delivery cost calculations
CREATE TABLE public.delivery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  zone TEXT NOT NULL DEFAULT 'default',
  free_threshold_ex_vat DECIMAL(10,2),
  flat_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  fuel_surcharge_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  pallet_deposit_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  cutoff_time TIME,
  delivery_days INTEGER[] NOT NULL DEFAULT '{}',
  tiers_json JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zones table for delivery zones
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT,
  postal_codes TEXT[] NOT NULL DEFAULT '{}',
  base_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_analytics table for analytics data
CREATE TABLE public.delivery_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  month DATE NOT NULL,
  total_fees_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  orders_under_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for delivery_rules
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view delivery rules" 
  ON public.delivery_rules 
  FOR SELECT 
  USING (true);

-- Add RLS policies for zones
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view zones" 
  ON public.zones 
  FOR SELECT 
  USING (true);

-- Add RLS policies for delivery_analytics
ALTER TABLE public.delivery_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their tenant" 
  ON public.delivery_analytics 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = delivery_analytics.tenant_id 
    AND m.user_id = auth.uid()
  ));

-- Create function for frequently ordered items (referenced in OrderingSuggestions.ts)
CREATE OR REPLACE FUNCTION public.get_frequent_items_by_supplier(
  supplier_id_param UUID,
  days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
  supplier_item_id UUID,
  item_name TEXT,
  order_count BIGINT,
  avg_quantity DECIMAL
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    ol.supplier_item_id,
    si.display_name as item_name,
    COUNT(*) as order_count,
    AVG(ol.qty_packs) as avg_quantity
  FROM order_lines ol
  JOIN supplier_items si ON si.id = ol.supplier_item_id
  WHERE ol.supplier_id = supplier_id_param
    AND ol.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY ol.supplier_item_id, si.display_name
  ORDER BY order_count DESC, avg_quantity DESC
  LIMIT 10;
$$;
