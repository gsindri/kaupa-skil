-- Add new industry categories
INSERT INTO public.categories (name, name_is, slug, sort_order) VALUES
('Fashion & Apparel', 'Tíska og Fatnaður', 'fashion-apparel', 100),
('Beauty & Cosmetics', 'Snyrti- og Lífsstílsvörur', 'beauty-cosmetics', 110),
('Electronics & Technology', 'Raftæki og Tækni', 'electronics-technology', 120),
('Industrial & Electrical', 'Iðnaður og Rafmagn', 'industrial-electrical', 130),
('Medical & Healthcare', 'Lækningar og Heilbrigðisþjónusta', 'medical-healthcare', 140),
('Chemicals & Automotive', 'Efni og Bílavarahlutir', 'chemicals-automotive', 150),
('Building Materials', 'Byggingarefni', 'building-materials', 160),
('Watches & Jewelry', 'Úr og Skartgripir', 'watches-jewelry', 170)
ON CONFLICT (slug) DO NOTHING;

-- Insert all new suppliers
INSERT INTO public.suppliers (
  id, name, display_name, legal_name, kennitala, logo_url, 
  short_description, website, contact_email, contact_phone,
  coverage_areas, badges, avg_lead_time_days, min_order_isk,
  verification_status, is_featured, created_at, updated_at
) VALUES
-- Food & Beverage Wholesalers
('bananar', 'Bananar ehf.', 'Bananar', 'Bananar ehf.', NULL, NULL,
 'Largest importer and distributor of fresh fruits, vegetables and berries in Iceland. Founded 1955, supplying ~900 customers nationwide.',
 'https://bananar.is', 'bananar@bananar.is', '+354 525 0100',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Fresh Produce', 'Local Partner'], 2, 50000,
 'approved', true, NOW(), NOW()),

('garri', 'Garri ehf.', 'Garri', 'Garri ehf.', NULL, NULL,
 'Leading family-owned wholesaler (founded 1973) specializing in foodservice products, food packaging, and hygiene solutions.',
 'https://garri.is', 'garri@garri.is', '+354 570 0300',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Foodservice', 'Packaging'], 3, 30000,
 'approved', true, NOW(), NOW()),

('mata', 'Mata', 'Mata', 'Mata ehf.', NULL, NULL,
 'Importer and distributor of fresh produce, meat, and other foodstuffs. Major holder of import quotas for agricultural products.',
 'https://mata.is', 'sala@mata.is', '+354 412 1300',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Produce', 'Meat'], 2, 40000,
 'approved', false, NOW(), NOW()),

('ojk-isam', 'ÓJ&K-ÍSAM', 'Ó. Johnson & Kaaber', 'Ó. Johnson & Kaaber - ÍSAM hf.', NULL, NULL,
 'Progressive wholesale company with extensive distribution network. Comprehensive supply services to retailers and HORECA. Established 1906.',
 'https://ojk-isam.is', 'ojk-isam@ojk-isam.is', '+354 535 4000',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Retail', 'HORECA'], 2, 50000,
 'approved', true, NOW(), NOW()),

('olgerdin', 'Ölgerðin Egill Skallagrímsson hf.', 'Ölgerðin', 'Ölgerðin Egill Skallagrímsson hf.', NULL, NULL,
 'Iceland''s oldest brewery (est. 1913) and major beverage wholesaler. Portfolio includes Pepsi, Appelsín, Tuborg, Gull, wines, spirits, and snacks.',
 'https://olgerdin.is', 'olgerdin@olgerdin.is', '+354 412 8000',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Beverages', 'Historic Brand'], 1, 25000,
 'approved', true, NOW(), NOW()),

('lindsay', 'John Lindsay ehf.', 'John Lindsay', 'John Lindsay ehf.', NULL, NULL,
 'Established trading company (founded 1926) focusing on import and wholesale of foreign branded consumer goods for supermarkets, pharmacies and restaurants.',
 'https://lindsay.is', 'lindsay@lindsay.is', '+354 533 2600',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Consumer Goods', 'B2B'], 3, 35000,
 'approved', false, NOW(), NOW()),

-- Fashion, Apparel & Consumer Goods
('run-heildverslun', 'Rún heildverslun', 'Rún', 'Rún ehf.', NULL, NULL,
 'Wholesaler of fashion clothing since 1984, specializing in importing branded apparel. Focuses on trendy and work clothing for retail stores.',
 'https://runheildverslun.is', 'run@run.is', '+354 561 9200',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Fashion', 'Wholesale Only'], 4, 50000,
 'approved', false, NOW(), NOW()),

('tribus', 'Tribus ehf.', 'Tribus', 'Tribus ehf.', NULL, NULL,
 'Distributor and wholesaler for global beauty and personal-care brands. Provides end-to-end distribution, marketing, and regulatory services.',
 'https://tribus.is', 'tribus@tribus.is', '+354 776 0400',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Beauty', 'Cosmetics'], 3, 25000,
 'approved', false, NOW(), NOW()),

('echo', 'Echo Ltd.', 'Echo', 'Echo Ltd.', NULL, NULL,
 'Leading import company (est. 1981) focusing on watches, jewelry, sunglasses. Exclusive Iceland distributor for Casio, Fossil, Raymond Weil.',
 'https://echo.is', 'echo@echo.is', '+354 515 9999',
 ARRAY['Kópavogur', 'Iceland'], ARRAY['Watches', 'Jewelry'], 3, 30000,
 'approved', false, NOW(), NOW()),

('maritime', 'Mari Time ehf.', 'Mari Time', 'Mari Time ehf.', NULL, NULL,
 'Leading supplier of watches and jewellery since 1972. Represents Casio, Fossil Group, Movado, Timex. Premium watches and jewelry wholesale.',
 'https://maritime.is', 'stefan@maritime.is', '+354 511 5500',
 ARRAY['Kópavogur', 'Iceland'], ARRAY['Premium Watches', 'Jewelry'], 3, 40000,
 'approved', false, NOW(), NOW()),

-- Industrial & Electrical
('smith-norland', 'Smith & Norland', 'Smith & Norland', 'Smith & Norland ehf.', NULL, NULL,
 'Major importer/wholesaler of electrical and industrial equipment (est. 1920). Official Siemens agent. Building tech, automation, lighting, machinery.',
 'https://sminor.is', 'raflager@sminor.is', '+354 520 3000',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Siemens Partner', 'Industrial'], 5, 75000,
 'approved', true, NOW(), NOW()),

('sg', 'S. Guðjónsson ehf.', 'S. Guðjónsson', 'S. Guðjónsson ehf.', NULL, NULL,
 'Leading importer of electrical installation materials (founded 1958). Switches, lighting, smart-home tech for electricians and contractors.',
 'https://sg.is', 'sg@sg.is', '+354 520 4500',
 ARRAY['Kópavogur', 'Iceland'], ARRAY['Electrical', 'Smart Home'], 4, 40000,
 'approved', false, NOW(), NOW()),

('krichter', 'K. Richter hf.', 'K. Richter', 'K. Richter hf.', NULL, NULL,
 'Importer of hardware goods and building materials since 1970. Weather stripping, seals, hand tools, household goods for hardware stores.',
 'https://krichter.is', 'krichter@krichter.is', '+354 565 9000',
 ARRAY['Garðabær', 'Iceland'], ARRAY['Hardware', 'Building'], 4, 30000,
 'approved', false, NOW(), NOW()),

('hj', 'Halldór Jónsson ehf.', 'Halldór Jónsson', 'Halldór Jónsson ehf.', NULL, NULL,
 'Established importer and wholesaler (founded 1955). Distributes cosmetics, fragrances, salon supplies. Agent for brands like Burberry perfume.',
 'https://hj.is', 'hj@hj.is', '+354 563 6300',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Cosmetics', 'Fragrances'], 3, 25000,
 'approved', false, NOW(), NOW()),

('kemi', 'Kemi ehf.', 'Kemi', 'Kemi ehf.', NULL, NULL,
 'Wholesaler of chemicals, cleaning agents, automotive maintenance products. Supplies industry and retail with specialized chemical products.',
 'https://kemi.is', 'kemi@kemi.is', '+354 415 4000',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Chemicals', 'Automotive'], 3, 20000,
 'approved', false, NOW(), NOW()),

-- Electronics & Tech
('srx', 'SRX ehf.', 'SRX', 'SRX ehf.', NULL, NULL,
 'One of Iceland''s largest electronics wholesalers (20+ years). Mobile phones, tablets, headphones, scooters, TVs, appliances. Major retail distributor.',
 'https://srx.is', 'info@srx.is', '+354 416 0300',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Electronics', 'Consumer Tech'], 2, 50000,
 'approved', true, NOW(), NOW()),

('distica', 'Dística hf.', 'Dística', 'Dística hf.', NULL, NULL,
 'Leading pharmaceutical distributor (~62% market share). Import, inventory, nationwide distribution of medicines to pharmacies, hospitals, clinics.',
 'https://distica.is', 'distica@distica.is', '+354 535 7000',
 ARRAY['Garðabær', 'Iceland'], ARRAY['Pharmaceutical', 'Healthcare'], 1, 100000,
 'approved', true, NOW(), NOW()),

('fastus', 'Fastus ehf.', 'Fastus', 'Fastus ehf.', NULL, NULL,
 'Distributor of medical devices, laboratory equipment and hospital supplies. High-quality medical equipment for healthcare sector with technical support.',
 'https://fastus.is', 'fastus@fastus.is', '+354 555 0000',
 ARRAY['Reykjavík', 'Iceland'], ARRAY['Medical Equipment', 'Lab Supplies'], 4, 75000,
 'approved', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create supplier-category associations
-- First, get category IDs (we'll use subqueries in the INSERT)
INSERT INTO public.supplier_categories (supplier_id, category_id)
SELECT supplier_id, category_id FROM (VALUES
  -- Food & Beverage suppliers mapped to food categories
  ('bananar', (SELECT id FROM categories WHERE slug = 'fresh-produce' LIMIT 1)),
  ('garri', (SELECT id FROM categories WHERE slug = 'foodservice' LIMIT 1)),
  ('mata', (SELECT id FROM categories WHERE slug = 'fresh-produce' LIMIT 1)),
  ('mata', (SELECT id FROM categories WHERE slug = 'meat-seafood' LIMIT 1)),
  ('ojk-isam', (SELECT id FROM categories WHERE slug = 'foodservice' LIMIT 1)),
  ('ojk-isam', (SELECT id FROM categories WHERE slug = 'beverages' LIMIT 1)),
  ('olgerdin', (SELECT id FROM categories WHERE slug = 'beverages' LIMIT 1)),
  ('lindsay', (SELECT id FROM categories WHERE slug = 'foodservice' LIMIT 1)),
  
  -- Fashion & Apparel
  ('run-heildverslun', (SELECT id FROM categories WHERE slug = 'fashion-apparel' LIMIT 1)),
  ('tribus', (SELECT id FROM categories WHERE slug = 'beauty-cosmetics' LIMIT 1)),
  ('echo', (SELECT id FROM categories WHERE slug = 'watches-jewelry' LIMIT 1)),
  ('maritime', (SELECT id FROM categories WHERE slug = 'watches-jewelry' LIMIT 1)),
  
  -- Industrial & Electrical
  ('smith-norland', (SELECT id FROM categories WHERE slug = 'industrial-electrical' LIMIT 1)),
  ('smith-norland', (SELECT id FROM categories WHERE slug = 'building-materials' LIMIT 1)),
  ('sg', (SELECT id FROM categories WHERE slug = 'industrial-electrical' LIMIT 1)),
  ('krichter', (SELECT id FROM categories WHERE slug = 'building-materials' LIMIT 1)),
  ('hj', (SELECT id FROM categories WHERE slug = 'beauty-cosmetics' LIMIT 1)),
  ('kemi', (SELECT id FROM categories WHERE slug = 'chemicals-automotive' LIMIT 1)),
  
  -- Electronics & Healthcare
  ('srx', (SELECT id FROM categories WHERE slug = 'electronics-technology' LIMIT 1)),
  ('distica', (SELECT id FROM categories WHERE slug = 'medical-healthcare' LIMIT 1)),
  ('fastus', (SELECT id FROM categories WHERE slug = 'medical-healthcare' LIMIT 1))
) AS t(supplier_id, category_id)
WHERE category_id IS NOT NULL
ON CONFLICT (supplier_id, category_id) DO NOTHING;