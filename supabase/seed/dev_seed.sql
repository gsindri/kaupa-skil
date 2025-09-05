-- Dev-only sample data. Execute with DEV_SAMPLE_DATA=true supabase db seed --file supabase/seed/dev_seed.sql
\if :{?DEV_SAMPLE_DATA}

-- Data originally seeded in migrations but now moved here for development only

-- Categories from initial migration
INSERT INTO public.categories (name, vat_code) VALUES
    ('Food & Beverages', 'standard'),
    ('Dairy Products', 'standard'),
    ('Meat & Seafood', 'standard'),
    ('Vegetables & Fruits', 'reduced'),
    ('Cleaning Supplies', 'standard'),
    ('Kitchen Equipment', 'standard');

-- Additional categories
INSERT INTO public.categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables and produce'),
  ('Fruits', 'Fresh fruits and berries'),
  ('Dairy', 'Milk, cheese, and dairy products'),
  ('Meat', 'Fresh meat and poultry'),
  ('Bakery', 'Bread, pastries, and baked goods');

-- Suppliers
INSERT INTO public.suppliers (name, contact_email, ordering_email, connector_type, logo_url) VALUES
    ('Véfkaupmenn', 'contact@vefkaupmenn.is', 'orders@vefkaupmenn.is', 'portal', '/placeholder.svg'),
    ('Heilsuhúsið', 'contact@heilsukhusid.is', 'orders@heilsukhusid.is', 'email', '/placeholder.svg'),
    ('Matfuglinn', 'contact@matfuglinn.is', 'orders@matfuglinn.is', 'portal', '/placeholder.svg');

INSERT INTO public.suppliers (name, website, contact_email, logo_url) VALUES
  ('Fresh Farm Foods', 'https://freshfarmfoods.com', 'orders@freshfarmfoods.com', '/placeholder.svg'),
  ('Quality Produce Co.', 'https://qualityproduce.com', 'sales@qualityproduce.com', '/placeholder.svg'),
  ('Local Dairy', 'https://localdairy.com', 'info@localdairy.com', '/placeholder.svg');

-- Sample supplier items
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
WHERE c.name IN ('Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery')
  AND random() > 0.7; -- Only create some items

-- Sample delivery rules
INSERT INTO public.delivery_rules (supplier_id, zone, free_threshold_ex_vat, flat_fee, fuel_surcharge_pct, delivery_days)
SELECT
  s.id,
  'default',
  50000, -- ISK 50,000 threshold
  2500,  -- ISK 2,500 flat fee
  5.0,   -- 5% fuel surcharge
  ARRAY[1,2,3,4,5] -- Monday to Friday
FROM public.suppliers s
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_rules dr
  WHERE dr.supplier_id = s.id
)
LIMIT 3; -- Just add rules for first 3 suppliers if any exist

\else
\echo 'DEV_SAMPLE_DATA flag not set; skipping dev seed data.'
\endif
