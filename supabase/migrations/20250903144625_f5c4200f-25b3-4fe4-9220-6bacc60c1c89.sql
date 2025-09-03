-- Fix security definer view issue by recreating without SECURITY DEFINER
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
  -- Priority: OUT_OF_STOCK first (avoid 'til á lager' substring issue),
  -- then IN_STOCK, LOW_STOCK, else UNKNOWN.
  CASE 
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%ekki til á lager%'
                      OR sp.availability_text ILIKE '%out of stock%'
                      OR sp.availability_text ILIKE '%unavailable%' THEN 1 END) > 0
         AND COUNT(CASE WHEN sp.availability_text ILIKE '%til á lager%'
                          AND sp.availability_text NOT ILIKE '%ekki til á lager%' THEN 1 END) = 0
      THEN 'OUT_OF_STOCK'
    WHEN COUNT(CASE WHEN (sp.availability_text ILIKE '%til á lager%' AND sp.availability_text NOT ILIKE '%ekki til á lager%')
                      OR sp.availability_text ILIKE '%in stock%'
                      OR sp.availability_text ILIKE '%available%' THEN 1 END) > 0
      THEN 'IN_STOCK'
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%lítið magn%'
                      OR sp.availability_text ILIKE '%low stock%'
                      OR sp.availability_text ILIKE '%limited%' THEN 1 END) > 0
      THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END AS availability_status,
  STRING_AGG(DISTINCT sp.availability_text, ', ') AS availability_text,
  COUNT(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE')::bigint AS active_supplier_count,
  ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS category_tags
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp
  ON sp.catalog_product_id = cp.id
  AND sp.active_status = 'ACTIVE'
LEFT JOIN LATERAL unnest(sp.category_path) AS category ON true
GROUP BY cp.id, cp.name, cp.brand;