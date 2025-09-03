-- Fix availability status mapping in v_public_catalog view
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
  -- Map availability text to proper status codes
  CASE 
    WHEN STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%til á lager%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%in stock%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%available%' THEN 'IN_STOCK'
    WHEN STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%ekki til á lager%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%out of stock%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%unavailable%' THEN 'OUT_OF_STOCK'
    WHEN STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%lítið magn%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%low stock%' 
      OR STRING_AGG(DISTINCT sp.availability_text, ', ') ILIKE '%limited%' THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  STRING_AGG(DISTINCT sp.availability_text, ', ') as availability_text
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
GROUP BY cp.id, cp.name, cp.brand;