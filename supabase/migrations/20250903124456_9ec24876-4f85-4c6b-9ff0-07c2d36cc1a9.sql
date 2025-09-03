-- Fix catalog security by updating existing policies with proper restrictions

-- Replace existing catalog_product policy with more restrictive version
DROP POLICY IF EXISTS "Tenant members can manage catalog products" ON public.catalog_product;
DROP POLICY IF EXISTS "Tenant members can view catalog products" ON public.catalog_product;

-- Create a more secure policy that requires tenant membership
CREATE POLICY "Tenant members can view catalog products" 
ON public.catalog_product 
FOR SELECT 
TO authenticated
USING (
  -- Only allow users who are members of at least one tenant
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Replace existing supplier_product policy with more restrictive version  
DROP POLICY IF EXISTS "Tenant members can manage supplier products" ON public.supplier_product;
DROP POLICY IF EXISTS "Tenant members can view supplier products" ON public.supplier_product;

-- Create a more secure policy that requires tenant membership
CREATE POLICY "Tenant members can view supplier products" 
ON public.supplier_product 
FOR SELECT 
TO authenticated
USING (
  -- Only allow users who are members of at least one tenant
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Recreate the catalog view with better structure
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  MAX(sp.last_seen_at) as availability_updated_at,
  STRING_AGG(DISTINCT sp.pack_size, ', ') as canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint as suppliers_count,
  MAX(sp.image_url) as sample_image_url,
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  NULL::numeric as best_price,
  MAX(sp.source_url) as sample_source_url,
  'UNKNOWN' as availability_status,  -- Simplified for now
  STRING_AGG(DISTINCT sp.availability_text, ', ') as availability_text
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
GROUP BY cp.id, cp.name, cp.brand;