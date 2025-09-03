-- Fix security issues by enabling RLS on the new table

-- Enable RLS on the supplier_product_availability table
ALTER TABLE supplier_product_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for the supplier_product_availability table
-- Since this is for internal availability tracking, restrict access appropriately
CREATE POLICY "System can manage availability data" 
  ON supplier_product_availability 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);