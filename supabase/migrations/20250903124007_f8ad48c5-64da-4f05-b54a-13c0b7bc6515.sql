-- Fix Security Definer View issue with a cleaner approach

-- First, remove the problematic SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.get_public_catalog_secure(integer, integer, text);

-- Recreate the original public catalog view with proper structure
CREATE OR REPLACE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  sp.last_seen_at as availability_updated_at,
  sp.pack_size as canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint as suppliers_count,
  (array_agg(DISTINCT sp.image_url) FILTER (WHERE sp.image_url IS NOT NULL))[1] as sample_image_url,
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  NULL::numeric as best_price,  -- Simplified for now
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
GROUP BY cp.id, cp.name, cp.brand, sp.last_seen_at, sp.pack_size;

-- Add RLS policies for authenticated access to catalog data
-- This replaces the SECURITY DEFINER approach with proper RLS

-- Policy for catalog_product (authenticated users can read)
DROP POLICY IF EXISTS "Authenticated users can view catalog products" ON public.catalog_product;
CREATE POLICY "Authenticated users can view catalog products" 
ON public.catalog_product 
FOR SELECT 
TO authenticated
USING (true);

-- Policy for supplier_product (authenticated users can read)  
DROP POLICY IF EXISTS "Authenticated users can view supplier products" ON public.supplier_product;
CREATE POLICY "Authenticated users can view supplier products" 
ON public.supplier_product 
FOR SELECT 
TO authenticated 
USING (true);

-- Remove the old secure view that's no longer needed
DROP VIEW IF EXISTS public.v_public_catalog_secure;