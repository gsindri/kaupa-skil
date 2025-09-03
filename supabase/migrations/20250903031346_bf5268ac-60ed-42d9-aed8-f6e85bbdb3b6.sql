-- Fix availability status derivation in v_public_catalog view
DROP VIEW IF EXISTS public.v_public_catalog CASCADE;

CREATE VIEW public.v_public_catalog AS
WITH catalog_suppliers AS (
  SELECT 
    sp.catalog_product_id,
    COUNT(DISTINCT sp.supplier_id) as suppliers_count,
    STRING_AGG(DISTINCT sp.pack_size, ', ' ORDER BY sp.pack_size) as pack_sizes,
    -- Derive canonical pack size (most common or first alphabetically)
    MODE() WITHIN GROUP (ORDER BY sp.pack_size) as canonical_pack,
    MIN(sp.image_url) as sample_image_url,
    MIN(sp.source_url) as sample_source_url,
    -- Derive availability status from availability_text instead of empty availability table
    CASE 
      WHEN COUNT(*) FILTER (WHERE sp.availability_text ILIKE '%til á lager%' OR sp.availability_text ILIKE '%á lager%') > 0 THEN 'IN_STOCK'
      WHEN COUNT(*) FILTER (WHERE sp.availability_text ILIKE '%ekki til%' OR sp.availability_text ILIKE '%ekki á lager%' OR sp.availability_text ILIKE '%útselt%') > 0 THEN 'OUT_OF_STOCK'
      WHEN COUNT(*) FILTER (WHERE sp.availability_text ILIKE '%lítið%' OR sp.availability_text ILIKE '%fátt%') > 0 THEN 'LOW_STOCK'
      ELSE 'UNKNOWN'
    END as availability_status,
    -- Get sample availability text
    MIN(sp.availability_text) FILTER (WHERE sp.availability_text IS NOT NULL) as availability_text,
    -- Get latest update timestamp from supplier product
    MAX(sp.updated_at) as availability_updated_at
  FROM supplier_product sp
  WHERE sp.catalog_product_id IS NOT NULL
  GROUP BY sp.catalog_product_id
)
SELECT 
  cp.name,
  cs.availability_updated_at,
  cp.id as catalog_id,
  cs.suppliers_count,
  cs.canonical_pack,
  cs.pack_sizes,
  cp.brand,
  cs.sample_image_url,
  cs.sample_source_url,
  cs.availability_status,
  cs.availability_text
FROM catalog_product cp
LEFT JOIN catalog_suppliers cs ON cp.id = cs.catalog_product_id;

-- Recreate the dependent functions
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid)
 RETURNS SETOF v_public_catalog
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- For now, just return all public catalog items
  -- This can be enhanced later to filter by organization
  select * from public.v_public_catalog;
$function$;

CREATE OR REPLACE FUNCTION public.v_org_catalog()
 RETURNS SETOF v_public_catalog
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select * from public.v_public_catalog;
$function$;