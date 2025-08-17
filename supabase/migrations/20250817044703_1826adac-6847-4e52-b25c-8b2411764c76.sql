
-- Add missing HAR-specific fields to supplier_items table
ALTER TABLE public.supplier_items 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS vat_code NUMERIC DEFAULT 0;

-- Add an index on last_seen_at for better query performance
CREATE INDEX IF NOT EXISTS idx_supplier_items_last_seen_at ON public.supplier_items(last_seen_at);

-- Add an index on brand for filtering
CREATE INDEX IF NOT EXISTS idx_supplier_items_brand ON public.supplier_items(brand);
