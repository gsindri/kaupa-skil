-- Step 1: Identify and clean up order_lines with missing/invalid supplier_product_id
-- This finds order_lines in draft orders that have NULL or invalid supplier_product_id
DELETE FROM order_lines
WHERE id IN (
  SELECT ol.id
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE o.status = 'draft'
    AND (ol.supplier_product_id IS NULL 
         OR NOT EXISTS (
           SELECT 1 FROM supplier_product sp 
           WHERE sp.id = ol.supplier_product_id
         ))
);

-- Step 2: Add NOT NULL constraint to supplier_product_id
-- This prevents future order_lines from being created without a valid supplier_product_id
ALTER TABLE order_lines 
ALTER COLUMN supplier_product_id SET NOT NULL;

-- Step 3: Add foreign key constraint to ensure supplier_product_id references valid records
-- This ensures data integrity at the database level
ALTER TABLE order_lines
ADD CONSTRAINT fk_order_lines_supplier_product
FOREIGN KEY (supplier_product_id) 
REFERENCES supplier_product(id)
ON DELETE CASCADE;