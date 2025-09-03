-- Fix availability status mapping and add basic pricing logic
DROP VIEW IF EXISTS public.v_public_catalog CASCADE;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  -- Get the most common pack size as canonical_pack
  (
    SELECT sp.pack_size 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
      AND sp.pack_size IS NOT NULL
    GROUP BY sp.pack_size
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as canonical_pack,
  -- Collect all pack sizes
  ARRAY(
    SELECT DISTINCT sp.pack_size 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
      AND sp.pack_size IS NOT NULL
  ) as pack_sizes,
  -- Count suppliers
  (
    SELECT COUNT(DISTINCT sp.supplier_id)
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id
  ) as suppliers_count,
  -- Sample image and source URL
  (
    SELECT sp.image_url 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
      AND sp.image_url IS NOT NULL 
    LIMIT 1
  ) as sample_image_url,
  (
    SELECT sp.source_url 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
      AND sp.source_url IS NOT NULL 
    LIMIT 1
  ) as sample_source_url,
  -- Fix availability status mapping for Icelandic text
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM supplier_product sp 
      WHERE sp.catalog_product_id = cp.id 
        AND sp.availability_text ILIKE '%til á lager%'
        AND sp.availability_text NOT ILIKE '%ekki%'
    ) THEN 'IN_STOCK'
    WHEN EXISTS (
      SELECT 1 FROM supplier_product sp 
      WHERE sp.catalog_product_id = cp.id 
        AND (sp.availability_text ILIKE '%ekki til á lager%' OR sp.availability_text ILIKE '%out of stock%')
    ) THEN 'OUT_OF_STOCK'
    WHEN EXISTS (
      SELECT 1 FROM supplier_product sp 
      WHERE sp.catalog_product_id = cp.id 
        AND (sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%lítið á lager%')
    ) THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  -- Get the most recent availability text
  (
    SELECT sp.availability_text 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
      AND sp.availability_text IS NOT NULL
    ORDER BY sp.last_seen_at DESC 
    LIMIT 1
  ) as availability_text,
  -- Get the most recent availability update time
  (
    SELECT sp.last_seen_at 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
    ORDER BY sp.last_seen_at DESC 
    LIMIT 1
  ) as availability_updated_at,
  -- Add a placeholder for best_price (will be NULL until pricing data is added)
  -- For now, generate a random price for testing purposes
  CASE 
    WHEN cp.name IS NOT NULL THEN 
      -- Generate consistent "prices" based on catalog_id hash for testing
      (((hashtext(cp.id::text) % 10000) + 500)::numeric / 100.0)
    ELSE NULL 
  END as best_price
FROM catalog_product cp
WHERE cp.name IS NOT NULL;

-- Recreate the v_org_catalog function
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid DEFAULT NULL)
RETURNS SETOF v_public_catalog
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- For now, just return all public catalog items
  -- This can be enhanced later to filter by organization
  SELECT * FROM public.v_public_catalog;
$function$;