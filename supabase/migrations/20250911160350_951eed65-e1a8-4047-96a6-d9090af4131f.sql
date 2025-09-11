-- Clean up duplicate Innnes supplier records and fix catalog view

-- First, let's see which supplier_products are using each record
WITH supplier_usage AS (
  SELECT supplier_id, COUNT(*) as product_count
  FROM supplier_product 
  WHERE supplier_id IN ('innnes', 'INNNES')
  GROUP BY supplier_id
)

-- Update all supplier_product references to use the canonical 'innnes' record (which has the logo)
UPDATE supplier_product 
SET supplier_id = 'innnes'
WHERE supplier_id = 'INNNES';

-- Delete the duplicate INNNES record
DELETE FROM suppliers WHERE id = 'INNNES';

-- Ensure the canonical innnes record has the correct name and logo
UPDATE suppliers 
SET name = 'Innnes', logo_url = '/inneslogo.svg'
WHERE id = 'innnes';

-- Update the v_public_catalog view to properly join supplier data
DROP VIEW IF EXISTS v_public_catalog;

CREATE VIEW v_public_catalog AS
SELECT DISTINCT
    cp.id as catalog_id,
    cp.name,
    cp.brand,
    cp.gtin,
    cp.size,
    
    -- Aggregate supplier information properly
    ARRAY_AGG(DISTINCT s.id ORDER BY s.id) FILTER (WHERE s.id IS NOT NULL) as supplier_ids,
    ARRAY_AGG(DISTINCT s.name ORDER BY s.name) FILTER (WHERE s.name IS NOT NULL) as supplier_names,
    ARRAY_AGG(DISTINCT s.logo_url ORDER BY s.logo_url) FILTER (WHERE s.logo_url IS NOT NULL) as supplier_logo_urls,
    COUNT(DISTINCT s.id) FILTER (WHERE s.id IS NOT NULL) as suppliers_count,
    COUNT(DISTINCT CASE WHEN sp.active_status = 'ACTIVE' THEN s.id END) as active_supplier_count,
    
    -- Availability information
    COALESCE(
        CASE 
            WHEN COUNT(CASE WHEN sp.active_status = 'ACTIVE' AND derive_availability_status(sp.availability_text) = 'IN_STOCK' THEN 1 END) > 0 THEN 'IN_STOCK'
            WHEN COUNT(CASE WHEN sp.active_status = 'ACTIVE' AND derive_availability_status(sp.availability_text) = 'LOW_STOCK' THEN 1 END) > 0 THEN 'LOW_STOCK'
            WHEN COUNT(CASE WHEN sp.active_status = 'ACTIVE' AND derive_availability_status(sp.availability_text) = 'OUT_OF_STOCK' THEN 1 END) > 0 THEN 'OUT_OF_STOCK'
            ELSE 'UNKNOWN'
        END,
        'UNKNOWN'
    ) as availability_status,
    
    -- Sample data from active products
    (SELECT sp2.availability_text FROM supplier_product sp2 WHERE sp2.catalog_product_id = cp.id AND sp2.active_status = 'ACTIVE' LIMIT 1) as availability_text,
    (SELECT sp2.image_url FROM supplier_product sp2 WHERE sp2.catalog_product_id = cp.id AND sp2.image_url IS NOT NULL LIMIT 1) as sample_image_url,
    (SELECT sp2.source_url FROM supplier_product sp2 WHERE sp2.catalog_product_id = cp.id AND sp2.source_url IS NOT NULL LIMIT 1) as sample_source_url,
    
    -- Pack size information
    ARRAY_AGG(DISTINCT sp.pack_size ORDER BY sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
    (SELECT sp2.pack_size FROM supplier_product sp2 WHERE sp2.catalog_product_id = cp.id AND sp2.pack_size IS NOT NULL LIMIT 1) as canonical_pack,
    
    -- Category information
    (SELECT ARRAY_AGG(DISTINCT category ORDER BY category) 
     FROM supplier_product sp2, unnest(sp2.category_path) as category 
     WHERE sp2.catalog_product_id = cp.id AND sp2.category_path IS NOT NULL) as category_tags,
    
    -- Pricing and special offers (placeholder for future implementation)
    NULL::numeric as best_price,
    false as on_special,
    
    -- Timestamps
    MAX(sp.last_seen_at) as availability_updated_at

FROM catalog_product cp
LEFT JOIN supplier_product sp ON sp.catalog_product_id = cp.id
LEFT JOIN suppliers s ON s.id = sp.supplier_id
GROUP BY cp.id, cp.name, cp.brand, cp.gtin, cp.size;