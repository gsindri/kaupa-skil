-- Add on_special flag to supplier products and expose it through catalog views
ALTER TABLE public.supplier_product
  ADD COLUMN IF NOT EXISTS on_special BOOLEAN DEFAULT false;

-- Drop dependent functions before recreating the view
DROP FUNCTION IF EXISTS public.v_org_catalog(uuid);
DROP FUNCTION IF EXISTS public.v_org_catalog();

DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT
  cp.id AS catalog_id,
  cp.name,
  cp.brand,
  MAX(sp.last_seen_at) AS availability_updated_at,
  STRING_AGG(DISTINCT sp.pack_size, ', ') AS canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint AS suppliers_count,
  MAX(sp.image_url) AS sample_image_url,
  ARRAY_AGG(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) AS pack_sizes,
  NULL::numeric AS best_price,
  MAX(sp.source_url) AS sample_source_url,
  CASE
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%ekki til á lager%' OR sp.availability_text ILIKE '%out of stock%' OR sp.availability_text ILIKE '%unavailable%' THEN 1 END) > 0
         AND COUNT(CASE WHEN sp.availability_text ILIKE '%til á lager%' AND sp.availability_text NOT ILIKE '%ekki til á lager%' THEN 1 END) = 0
      THEN 'OUT_OF_STOCK'
    WHEN COUNT(CASE WHEN (sp.availability_text ILIKE '%til á lager%' AND sp.availability_text NOT ILIKE '%ekki til á lager%')
                      OR sp.availability_text ILIKE '%in stock%'
                      OR sp.availability_text ILIKE '%available%' THEN 1 END) > 0
      THEN 'IN_STOCK'
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%lítið magn%' OR sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%limited%' THEN 1 END) > 0
      THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END AS availability_status,
  STRING_AGG(DISTINCT sp.availability_text, ', ') AS availability_text,
  COUNT(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE')::bigint AS active_supplier_count,
  ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS category_tags,
  BOOL_OR(sp.on_special) AS on_special
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp
  ON sp.catalog_product_id = cp.id
  AND sp.active_status = 'ACTIVE'
LEFT JOIN LATERAL unnest(sp.category_path) AS category ON true
GROUP BY cp.id, cp.name, cp.brand;

-- Recreate the v_org_catalog helper functions
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid)
 RETURNS SETOF v_public_catalog
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
