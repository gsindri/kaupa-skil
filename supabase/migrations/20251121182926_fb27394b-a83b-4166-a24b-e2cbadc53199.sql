-- Populate catalog_product_id for existing order_lines in draft orders
-- This fixes cart items that were created without catalog_product_id
UPDATE order_lines ol
SET catalog_product_id = sp.catalog_product_id
FROM supplier_product sp
WHERE ol.supplier_product_id = sp.id
  AND ol.catalog_product_id IS NULL
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = ol.order_id 
    AND o.status = 'draft'
  );