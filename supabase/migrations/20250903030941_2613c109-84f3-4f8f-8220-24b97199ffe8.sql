-- Enable RLS on tables that need it and create appropriate policies

-- Enable RLS on catalog_product table
ALTER TABLE public.catalog_product ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to catalog products
CREATE POLICY "Public catalog products are viewable by everyone" 
ON public.catalog_product 
FOR SELECT 
USING (true);

-- Create policy to allow system inserts/updates (for data ingestion)
CREATE POLICY "System can manage catalog products" 
ON public.catalog_product 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on supplier_product table
ALTER TABLE public.supplier_product ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to supplier products
CREATE POLICY "Public supplier products are viewable by everyone" 
ON public.supplier_product 
FOR SELECT 
USING (true);

-- Create policy to allow system inserts/updates (for data ingestion)
CREATE POLICY "System can manage supplier products" 
ON public.supplier_product 
FOR ALL 
USING (true)
WITH CHECK (true);