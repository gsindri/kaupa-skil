
-- Create storage bucket for HAR files
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-intake', 'supplier-intake', false);

-- Add missing fields to supplier_items for HAR processing
ALTER TABLE public.supplier_items 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS pack_unit_id text REFERENCES units(id),
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS vat_code text DEFAULT '24';

-- Create computed relationship_id view helper
CREATE OR REPLACE FUNCTION get_relationship_id(tenant_id_param uuid, supplier_id_param uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT tenant_id_param::text || ':' || supplier_id_param::text;
$$;

-- Modify price_quotes table for HAR integration
ALTER TABLE public.price_quotes
ADD COLUMN IF NOT EXISTS file_key text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS relationship_id text,
ADD COLUMN IF NOT EXISTS supplier_sku text,
ADD COLUMN IF NOT EXISTS price_per_pack_ex_vat numeric,
ADD COLUMN IF NOT EXISTS seen_at timestamp with time zone DEFAULT now();

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS price_quotes_relationship_sku_seen_idx 
ON public.price_quotes (relationship_id, supplier_sku, seen_at DESC);

-- Set up RLS policies for storage bucket
CREATE POLICY "Authenticated users can upload to supplier-intake bucket"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'supplier-intake');

CREATE POLICY "Users can view their tenant's HAR files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'supplier-intake' AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN memberships m ON m.tenant_id = t.id 
    WHERE m.user_id = auth.uid()
));
