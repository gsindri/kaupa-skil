-- Update availability_status enum to use uppercase values with underscores
ALTER TYPE availability_status RENAME TO availability_status_old;

CREATE TYPE availability_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN');

-- Update the supplier_product_availability table to use new enum
ALTER TABLE supplier_product_availability 
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE availability_status USING 
  CASE status::text 
    WHEN 'in_stock' THEN 'IN_STOCK'::availability_status
    WHEN 'low' THEN 'LOW_STOCK'::availability_status  
    WHEN 'out' THEN 'OUT_OF_STOCK'::availability_status
    WHEN 'unknown' THEN 'UNKNOWN'::availability_status
    ELSE 'UNKNOWN'::availability_status
  END,
ALTER COLUMN status SET DEFAULT 'UNKNOWN'::availability_status;

-- Drop old enum
DROP TYPE availability_status_old;

-- Drop and recreate the v_public_catalog view to properly derive availability status
DROP VIEW IF EXISTS public.v_public_catalog;

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
    -- Get the best availability status across all suppliers
    CASE 
      WHEN COUNT(*) FILTER (WHERE spa.status = 'IN_STOCK') > 0 THEN 'IN_STOCK'
      WHEN COUNT(*) FILTER (WHERE spa.status = 'LOW_STOCK') > 0 THEN 'LOW_STOCK' 
      WHEN COUNT(*) FILTER (WHERE spa.status = 'OUT_OF_STOCK') > 0 THEN 'OUT_OF_STOCK'
      ELSE 'UNKNOWN'
    END as availability_status,
    -- Get sample availability text
    MIN(sp.availability_text) FILTER (WHERE sp.availability_text IS NOT NULL) as availability_text,
    -- Get latest availability update timestamp
    MAX(spa.updated_at) as availability_updated_at
  FROM supplier_product sp
  LEFT JOIN supplier_product_availability spa ON sp.id = spa.supplier_product_id
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