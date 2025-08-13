
-- Create missing tables for proper tenant isolation and supplier management

-- Add missing order_dispatches table (referenced in OrderComposer)
CREATE TABLE IF NOT EXISTS public.order_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'failed')),
  attachments JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant_suppliers junction table for proper supplier relationships
CREATE TABLE IF NOT EXISTS public.tenant_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, supplier_id)
);

-- Add proper RLS policies for order_dispatches
ALTER TABLE public.order_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dispatches for their tenant orders" 
  ON public.order_dispatches 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_dispatches.order_id 
      AND o.tenant_id IN (
        SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create dispatches for their tenant orders" 
  ON public.order_dispatches 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_dispatches.order_id 
      AND o.tenant_id IN (
        SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
      )
    )
  );

-- Add proper RLS policies for tenant_suppliers
ALTER TABLE public.tenant_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant suppliers" 
  ON public.tenant_suppliers 
  FOR SELECT 
  USING (
    tenant_id IN (
      SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage suppliers" 
  ON public.tenant_suppliers 
  FOR ALL 
  USING (
    has_capability('manage_supplier_links', 'tenant', tenant_id)
  )
  WITH CHECK (
    has_capability('manage_supplier_links', 'tenant', tenant_id)
  );

-- Add proper RLS policies for missing tables that should be tenant-scoped
CREATE POLICY "Users can view supplier items for their tenant suppliers" 
  ON public.supplier_items 
  FOR SELECT 
  USING (
    supplier_id IN (
      SELECT ts.supplier_id 
      FROM public.tenant_suppliers ts 
      JOIN public.memberships m ON m.tenant_id = ts.tenant_id 
      WHERE m.user_id = auth.uid() AND ts.is_active = true
    )
  );

CREATE POLICY "Users can view price quotes for their tenant suppliers" 
  ON public.price_quotes 
  FOR SELECT 
  USING (
    supplier_item_id IN (
      SELECT si.id 
      FROM public.supplier_items si
      JOIN public.tenant_suppliers ts ON ts.supplier_id = si.supplier_id
      JOIN public.memberships m ON m.tenant_id = ts.tenant_id 
      WHERE m.user_id = auth.uid() AND ts.is_active = true
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_dispatches_order_id ON public.order_dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_supplier_id ON public.order_dispatches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tenant_suppliers_tenant_id ON public.tenant_suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_suppliers_supplier_id ON public.tenant_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_supplier_id ON public.supplier_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_supplier_item_id ON public.price_quotes(supplier_item_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
