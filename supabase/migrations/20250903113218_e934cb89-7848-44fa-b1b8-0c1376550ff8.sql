-- Remove fake pricing logic from v_public_catalog view
CREATE OR REPLACE VIEW v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  cp.size as canonical_pack,
  -- Get all pack sizes for this catalog product
  (
    SELECT array_agg(DISTINCT sp.pack_size ORDER BY sp.pack_size) 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id AND sp.pack_size IS NOT NULL
  ) as pack_sizes,
  -- Count suppliers for this catalog product
  (
    SELECT count(DISTINCT sp.supplier_id)
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id
  ) as suppliers_count,
  -- Get sample image (first available)
  (SELECT sp.image_url FROM supplier_product sp WHERE sp.catalog_product_id = cp.id AND sp.image_url IS NOT NULL LIMIT 1) as sample_image_url,
  -- Get sample source URL (first available)
  (SELECT sp.source_url FROM supplier_product sp WHERE sp.catalog_product_id = cp.id AND sp.source_url IS NOT NULL LIMIT 1) as sample_source_url,
  -- Map Icelandic availability text to standardized status
  (
    SELECT 
      CASE 
        WHEN sp.availability_text ILIKE '%til á lager%' OR sp.availability_text ILIKE '%á lager%' THEN 'IN_STOCK'
        WHEN sp.availability_text ILIKE '%ekki á lager%' OR sp.availability_text ILIKE '%uppselt%' THEN 'OUT_OF_STOCK'
        WHEN sp.availability_text ILIKE '%lítið á lager%' OR sp.availability_text ILIKE '%fátt á lager%' THEN 'LOW_STOCK'
        ELSE 'UNKNOWN'
      END
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
    ORDER BY sp.last_seen_at DESC 
    LIMIT 1
  ) as availability_status,
  -- Get most recent availability text
  (
    SELECT sp.availability_text 
    FROM supplier_product sp 
    WHERE sp.catalog_product_id = cp.id 
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
  -- Remove fake pricing - set to NULL until real pricing infrastructure is implemented
  NULL::numeric as best_price
FROM catalog_product cp
WHERE cp.name IS NOT NULL;