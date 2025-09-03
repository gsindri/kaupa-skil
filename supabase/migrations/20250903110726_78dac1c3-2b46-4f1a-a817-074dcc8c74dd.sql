-- Update v_public_catalog view to include price information
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
WITH price_data AS (
  SELECT 
    sp.catalog_product_id,
    MIN(CASE 
      WHEN o.price IS NOT NULL AND o.price > 0 
      THEN o.price 
      ELSE NULL 
    END) as best_price
  FROM public.supplier_product sp
  LEFT JOIN public.offer o ON o.supplier_product_id = sp.id
  WHERE sp.catalog_product_id IS NOT NULL
  GROUP BY sp.catalog_product_id
),
availability_data AS (
  SELECT 
    sp.catalog_product_id,
    MAX(sp.last_seen_at) as availability_updated_at,
    -- Aggregate availability logic with priority: OUT_OF_STOCK > LOW_STOCK > IN_STOCK > UNKNOWN
    CASE 
      WHEN bool_or(LOWER(spa.availability_text) SIMILAR TO '%(ekki|not|out|unavailable)%') THEN 'OUT_OF_STOCK'
      WHEN bool_or(LOWER(spa.availability_text) SIMILAR TO '%(low|few|little)%') THEN 'LOW_STOCK'  
      WHEN bool_or(LOWER(spa.availability_text) SIMILAR TO '%(available|in stock|on hand|ready)%') THEN 'IN_STOCK'
      WHEN bool_or(spa.availability_text IS NOT NULL AND spa.availability_text != '') THEN 'UNKNOWN'
      ELSE 'UNKNOWN'
    END as availability_status,
    string_agg(DISTINCT spa.availability_text, ', ' ORDER BY spa.availability_text) as availability_text
  FROM public.supplier_product sp
  LEFT JOIN public.supplier_product_availability spa ON spa.supplier_product_id = sp.id
  WHERE sp.catalog_product_id IS NOT NULL
  GROUP BY sp.catalog_product_id
)
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  cp.size as canonical_pack,
  array_agg(DISTINCT sp.pack_size ORDER BY sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  COUNT(DISTINCT sp.supplier_id) as suppliers_count,
  (array_agg(sp.image_url ORDER BY sp.created_at DESC) FILTER (WHERE sp.image_url IS NOT NULL))[1] as sample_image_url,
  (array_agg(sp.source_url ORDER BY sp.created_at DESC) FILTER (WHERE sp.source_url IS NOT NULL))[1] as sample_source_url,
  ad.availability_status,
  ad.availability_text, 
  ad.availability_updated_at,
  pd.best_price
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
LEFT JOIN availability_data ad ON ad.catalog_product_id = cp.id
LEFT JOIN price_data pd ON pd.catalog_product_id = cp.id
GROUP BY 
  cp.id, cp.name, cp.brand, cp.size, 
  ad.availability_status, ad.availability_text, ad.availability_updated_at,
  pd.best_price;