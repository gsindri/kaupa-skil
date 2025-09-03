-- Fix the overly permissive catalog access policies
-- Restrict catalog access to tenant members only, not all authenticated users

-- Remove the overly broad authenticated user policies
DROP POLICY IF EXISTS "Authenticated users can view catalog products" ON public.catalog_product;
DROP POLICY IF EXISTS "Authenticated users can view supplier products" ON public.supplier_product;

-- Create more restrictive policies that require tenant membership
CREATE POLICY "Tenant members can view catalog products" 
ON public.catalog_product 
FOR SELECT 
TO authenticated
USING (
  -- Allow access if user is a member of any tenant (has at least one membership)
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenant members can view supplier products" 
ON public.supplier_product 
FOR SELECT 
TO authenticated
USING (
  -- Allow access if user is a member of any tenant (has at least one membership)
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Update the public catalog view to be more restrictive
-- The view will now only return data for users who are tenant members
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  sp.last_seen_at as availability_updated_at,
  sp.pack_size as canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint as suppliers_count,
  (array_agg(DISTINCT sp.image_url) FILTER (WHERE sp.image_url IS NOT NULL))[1] as sample_image_url,
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  NULL::numeric as best_price,  -- Price data removed for now
  (array_agg(DISTINCT sp.source_url) FILTER (WHERE sp.source_url IS NOT NULL))[1] as sample_source_url,
  CASE 
    WHEN COUNT(sp.*) FILTER (WHERE sp.availability_text ILIKE '%in stock%' OR sp.availability_text ILIKE '%available%') > 0 THEN 'IN_STOCK'
    WHEN COUNT(sp.*) FILTER (WHERE sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%limited%') > 0 THEN 'LOW_STOCK'  
    WHEN COUNT(sp.*) FILTER (WHERE sp.availability_text ILIKE '%out of stock%' OR sp.availability_text ILIKE '%unavailable%') > 0 THEN 'OUT_OF_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  (array_agg(DISTINCT sp.availability_text) FILTER (WHERE sp.availability_text IS NOT NULL))[1] as availability_text
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
-- View inherits RLS from underlying tables, so only tenant members will see data
GROUP BY cp.id, cp.name, cp.brand;