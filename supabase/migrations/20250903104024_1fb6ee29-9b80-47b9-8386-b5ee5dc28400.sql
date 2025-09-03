-- Fix availability status logic by dropping dependencies first
-- Drop functions that depend on v_public_catalog view
DROP FUNCTION IF EXISTS public.v_org_catalog(uuid);
DROP FUNCTION IF EXISTS public.v_org_catalog();

-- Drop the view
DROP VIEW IF EXISTS public.v_public_catalog;

-- Recreate the view with corrected availability status logic
CREATE VIEW public.v_public_catalog AS
SELECT 
    cp.id as catalog_id,
    cp.name,
    cp.brand,
    string_agg(DISTINCT sp.pack_size, ', ' ORDER BY sp.pack_size) as pack_sizes,
    (array_agg(sp.pack_size ORDER BY sp.pack_size))[1] as canonical_pack,
    count(DISTINCT sp.supplier_id) as suppliers_count,
    (array_agg(sp.image_url ORDER BY sp.created_at DESC))[1] as sample_image_url,
    (array_agg(sp.source_url ORDER BY sp.created_at DESC))[1] as sample_source_url,
    (array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1] as availability_text,
    max(sp.last_seen_at) as availability_updated_at,
    -- Fixed CASE statement: check OUT_OF_STOCK patterns FIRST before IN_STOCK patterns
    CASE 
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%ekki til%' THEN 'OUT_OF_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%ekki á lager%' THEN 'OUT_OF_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%útselt%' THEN 'OUT_OF_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%lítið%' THEN 'LOW_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%fátt%' THEN 'LOW_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%til á lager%' THEN 'IN_STOCK'
        WHEN lower((array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC))[1]) LIKE '%á lager%' THEN 'IN_STOCK'
        ELSE 'UNKNOWN'
    END as availability_status
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
GROUP BY cp.id, cp.name, cp.brand
ORDER BY cp.name;

-- Recreate the v_org_catalog functions
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid)
 RETURNS SETOF v_public_catalog
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- For now, just return all public catalog items with the corrected availability logic
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