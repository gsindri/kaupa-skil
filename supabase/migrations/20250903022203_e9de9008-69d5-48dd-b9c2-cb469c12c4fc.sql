-- Step 2: Add availability infrastructure to the database

-- Create availability status enum
DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM ('in_stock', 'low', 'out', 'unknown');
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- Create supplier product availability table for future explicit availability tracking
CREATE TABLE IF NOT EXISTS supplier_product_availability (
  supplier_product_id uuid PRIMARY KEY REFERENCES supplier_product(id) ON DELETE CASCADE,
  status availability_status NOT NULL DEFAULT 'unknown',
  qty numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  note text
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS supplier_product_availability_updated_at_idx
  ON supplier_product_availability(updated_at DESC);

-- Create or replace the v_public_catalog view to include availability
CREATE OR REPLACE VIEW v_public_catalog AS
WITH availability_data AS (
  SELECT 
    sp.catalog_product_id,
    sp.id as supplier_product_id,
    -- For now, derive availability from availability_text in supplier_product
    CASE 
      WHEN sp.availability_text IS NOT NULL AND sp.availability_text ILIKE '%in stock%' THEN 'in_stock'::text
      WHEN sp.availability_text IS NOT NULL AND sp.availability_text ILIKE '%out%' THEN 'out'::text
      WHEN sp.availability_text IS NOT NULL AND sp.availability_text ILIKE '%low%' THEN 'low'::text
      ELSE 'unknown'::text
    END as availability_status,
    COALESCE(sp.availability_text, 'Unknown') as availability_text,
    sp.updated_at as availability_updated_at
  FROM supplier_product sp
),
catalog_base AS (
  SELECT 
    cp.id as catalog_id,
    cp.name,
    cp.brand,
    cp.size as canonical_pack,
    ARRAY_AGG(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
    COUNT(DISTINCT sp.supplier_id) as suppliers_count,
    (ARRAY_AGG(sp.image_url) FILTER (WHERE sp.image_url IS NOT NULL))[1] as sample_image_url,
    (ARRAY_AGG(sp.source_url) FILTER (WHERE sp.source_url IS NOT NULL))[1] as sample_source_url,
    -- Get the most common availability status
    MODE() WITHIN GROUP (ORDER BY ad.availability_status) as availability_status,
    -- Get a representative availability text
    (ARRAY_AGG(ad.availability_text ORDER BY ad.availability_updated_at DESC))[1] as availability_text,
    MAX(ad.availability_updated_at) as availability_updated_at
  FROM catalog_product cp
  LEFT JOIN supplier_product sp ON sp.catalog_product_id = cp.id
  LEFT JOIN availability_data ad ON ad.supplier_product_id = sp.id
  GROUP BY cp.id, cp.name, cp.brand, cp.size
)
SELECT 
  catalog_id,
  name,
  brand,
  canonical_pack,
  pack_sizes,
  suppliers_count,
  sample_image_url,
  sample_source_url,
  availability_status,
  availability_text,
  availability_updated_at
FROM catalog_base;