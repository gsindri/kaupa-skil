-- Update v_public_catalog view to include supplier information
DROP VIEW IF EXISTS public.v_public_catalog CASCADE;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  cp.size as canonical_pack,
  
  -- Aggregate pack sizes from supplier products
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL AND sp.active_status = 'ACTIVE') as pack_sizes,
  
  -- Count suppliers
  count(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as suppliers_count,
  count(DISTINCT CASE WHEN sp.active_status = 'ACTIVE' THEN sp.supplier_id END) as active_supplier_count,
  
  -- Aggregate supplier information
  array_agg(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as supplier_ids,
  array_agg(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as supplier_names,
  
  -- Sample image and source URL
  (array_agg(sp.image_url) FILTER (WHERE sp.image_url IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as sample_image_url,
  (array_agg(sp.source_url) FILTER (WHERE sp.source_url IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as sample_source_url,
  
  -- Availability information (use most recent)
  (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as availability_text,
  
  -- Map availability text to status
  CASE 
    WHEN (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%in stock%' 
         OR (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%available%' THEN 'IN_STOCK'
    WHEN (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%low stock%' 
         OR (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%limited%' THEN 'LOW_STOCK'
    WHEN (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%out of stock%' 
         OR (array_agg(sp.availability_text ORDER BY sp.updated_at DESC) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] ILIKE '%unavailable%' THEN 'OUT_OF_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  
  -- Most recent availability update
  max(sp.updated_at) FILTER (WHERE sp.active_status = 'ACTIVE') as availability_updated_at,
  
  -- Category tags from category paths
  array_agg(DISTINCT unnest_cat) FILTER (WHERE unnest_cat IS NOT NULL AND sp.active_status = 'ACTIVE') as category_tags,
  
  -- Best price (placeholder for now)
  NULL::numeric as best_price

FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
LEFT JOIN LATERAL unnest(sp.category_path) AS unnest_cat ON true
WHERE EXISTS (
  SELECT 1 FROM public.supplier_product sp2 
  WHERE sp2.catalog_product_id = cp.id 
  AND sp2.active_status = 'ACTIVE'
)
GROUP BY cp.id, cp.name, cp.brand, cp.size;