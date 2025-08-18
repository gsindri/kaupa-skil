
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_items table
CREATE TABLE public.supplier_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ext_sku TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_ex_vat DECIMAL(10,2),
  vat_rate DECIMAL(5,4) DEFAULT 0.0000,
  unit_size TEXT,
  pack_size INTEGER DEFAULT 1,
  in_stock BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, ext_sku)
);

-- Add RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories" 
  ON public.categories 
  FOR SELECT 
  USING (true);

-- Add RLS policies for suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers" 
  ON public.suppliers 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage suppliers" 
  ON public.suppliers 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Add RLS policies for supplier_items
ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view supplier items" 
  ON public.supplier_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage supplier items" 
  ON public.supplier_items 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Insert some sample data for testing
INSERT INTO public.categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables and produce'),
  ('Fruits', 'Fresh fruits and berries'),
  ('Dairy', 'Milk, cheese, and dairy products'),
  ('Meat', 'Fresh meat and poultry'),
  ('Bakery', 'Bread, pastries, and baked goods');

INSERT INTO public.suppliers (name, website, contact_email) VALUES
  ('Fresh Farm Foods', 'https://freshfarmfoods.com', 'orders@freshfarmfoods.com'),
  ('Quality Produce Co.', 'https://qualityproduce.com', 'sales@qualityproduce.com'),
  ('Local Dairy', 'https://localdairy.com', 'info@localdairy.com');

-- Insert some sample supplier items
INSERT INTO public.supplier_items (supplier_id, category_id, ext_sku, display_name, description, price_ex_vat, in_stock) 
SELECT 
  s.id,
  c.id,
  'SKU-' || generate_random_uuid()::text,
  CASE 
    WHEN c.name = 'Vegetables' THEN 'Fresh ' || (ARRAY['Carrots', 'Potatoes', 'Onions', 'Tomatoes', 'Lettuce'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Fruits' THEN 'Organic ' || (ARRAY['Apples', 'Bananas', 'Oranges', 'Grapes', 'Berries'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Dairy' THEN (ARRAY['Whole Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Meat' THEN 'Premium ' || (ARRAY['Chicken Breast', 'Ground Beef', 'Pork Chops', 'Salmon', 'Turkey'])[floor(random() * 5 + 1)]
    ELSE 'Fresh ' || (ARRAY['Bread', 'Croissants', 'Muffins', 'Bagels', 'Rolls'])[floor(random() * 5 + 1)]
  END,
  'High quality product from ' || s.name,
  (random() * 50 + 5)::decimal(10,2),
  random() > 0.1
FROM public.suppliers s
CROSS JOIN public.categories c
WHERE random() > 0.7; -- Only create some items, not all combinations
