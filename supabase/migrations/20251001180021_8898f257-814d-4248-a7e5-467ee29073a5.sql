-- Update Innnes ehf. with complete information
UPDATE suppliers
SET 
  display_name = 'Innnes',
  legal_name = 'Innnes ehf.',
  website = 'https://innnes.is/',
  contact_phone = '+354 530 4000',
  short_description = 'Leading importer and distributor of global food brands with national coverage. One of Iceland''s premier food wholesalers.',
  coverage_areas = ARRAY['National'],
  is_featured = true
WHERE id = 'innnes';

-- Insert categories only if they don't exist
INSERT INTO categories (name, name_is, slug, sort_order) 
SELECT * FROM (VALUES
  ('Food & Beverage', 'Matvæli og drykkir', 'food-beverage', 10),
  ('Meat & Poultry Processing', 'Kjöt og alifuglavinnslur', 'meat-poultry', 50),
  ('Dairy Products', 'Mjólkurvörur', 'dairy', 51),
  ('Seafood & Fish Processing', 'Sjávarafurðir og fiskvinnsla', 'seafood', 52),
  ('Confectionery & Sweets', 'Sælgæti og nammi', 'confectionery', 53),
  ('Coffee & Tea', 'Kaffi og te', 'coffee-tea', 54),
  ('Bakery Ingredients & Equipment', 'Bakaríefni og tæki', 'bakery-supplies', 55),
  ('Eggs & Egg Products', 'Egg og eggjavörur', 'eggs', 56),
  ('Ice Cream & Frozen Desserts', 'Ís og frosnar eftirréttir', 'ice-cream', 57),
  ('Health Foods & Organic', 'Heilsuvörur og lífrænt', 'health-organic', 58)
) AS v(name, name_is, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE categories.slug = v.slug
);

-- Add 31 new suppliers
INSERT INTO suppliers (id, name, display_name, legal_name, website, contact_email, contact_phone, short_description, coverage_areas, badges, avg_lead_time_days, verification_status, is_featured) VALUES
  ('nathan-olsen', 'Nathan & Olsen', 'Nathan & Olsen', 'Nathan & Olsen ehf.', 'https://nathan.is/', NULL, '+354 510 5800', 'Sales, marketing and distribution of international grocery brands with B2B webshop.', ARRAY['National'], ARRAY['B2B Portal', 'International Brands'], 2, 'approved', true),
  ('islensk-dreifing', 'Íslensk Dreifing', 'Íslensk Dreifing', 'Íslensk Dreifing ehf.', 'https://islenskdreifing.is/', 'info@islenskdreifing.is', '+354 568 7374', 'Distributor specializing in confectionery and packaged foods.', ARRAY['National'], NULL, 2, 'approved', false),
  ('hb-heildverslun', 'HB Heildverslun', 'HB Heildverslun', 'HB heildverslun ehf.', 'https://hbheildverslun.is/', NULL, '+354 782 7262', 'Importer and wholesaler for specialty gourmet and health food brands.', ARRAY['National'], ARRAY['Specialty Foods', 'Health'], 3, 'approved', false),
  ('danco', 'Danco', 'Danco', 'Danco ehf.', 'https://danco.is/', NULL, NULL, 'Wholesale supplier of frozen appetizers, party foods, breads and cakes for HORECA.', ARRAY['National'], ARRAY['Frozen Foods', 'HORECA'], 2, 'approved', false),
  ('bako-isberg', 'Bako Ísberg', 'Bako Ísberg', 'Bako Ísberg ehf.', 'https://bako.is/', NULL, NULL, 'Leading wholesaler for bakeries and foodservice.', ARRAY['National'], ARRAY['Bakery', 'Equipment'], 2, 'approved', true),
  ('sfg', 'SFG', 'Sölufélag Garðyrkjumanna', 'SFG - Sölufélag garðyrkjumanna', 'https://sfg.is/', NULL, NULL, 'National wholesaler for domestic greenhouse and field-grown produce.', ARRAY['National'], ARRAY['Local Produce', 'Icelandic'], 1, 'approved', true),
  ('ss', 'SS', 'Sláturfélag Suðurlands', 'Sláturfélag Suðurlands hf.', 'https://ss.is/', 'ss@ss.is', '+354 575 6000', 'Iceland''s leading meat producer and distributor with comprehensive national B2B coverage.', ARRAY['National'], ARRAY['Meat Producer', 'National Leader'], 1, 'approved', true),
  ('kn', 'KN', 'Kjarnafæði Norðlenska', 'Kjarnafæði Norðlenska hf.', 'https://kn.is/', NULL, '+354 469 4500', 'Major national meat wholesaler formed by merger of Kjarnafæði and Norðlenska.', ARRAY['National'], ARRAY['Meat Processing'], 2, 'approved', true),
  ('ali', 'Ali', 'Reykjagarður (Ali)', 'Reykjagarður hf.', 'https://ali.is/', NULL, '+354 420 4100', 'Iceland''s primary chicken producer with wholesale distribution.', ARRAY['National'], ARRAY['Poultry', 'Local Producer'], 1, 'approved', true),
  ('kjarnafaedi', 'Kjarnafæði', 'Kjarnafæði', 'Kjarnafæði ehf.', 'https://kjarnafaedi.is/', NULL, NULL, 'Meat processing and wholesale distribution in South Iceland.', ARRAY['South Iceland'], ARRAY['Meat Processing'], 2, 'approved', false),
  ('ms', 'MS', 'Mjólkursamsalan', 'MS - Mjólkursamsalan', 'https://ms.is/', NULL, '+354 450 1100', 'Iceland''s national dairy cooperative.', ARRAY['National'], ARRAY['Dairy Co-op', 'National Leader'], 1, 'approved', true),
  ('ks', 'KS', 'Kaupfélag Skagfirðinga', 'Kaupfélag Skagfirðinga (KS)', 'https://ks.is/', NULL, '+354 455 6000', 'Regional dairy and meat cooperative based in Sauðárkrókur.', ARRAY['North Iceland'], ARRAY['Regional Co-op', 'Dairy'], 2, 'approved', false),
  ('brunegg', 'Brúnegg', 'Brúnegg', 'Brúnegg ehf.', 'https://brunegg.is/', NULL, NULL, 'Egg producer with wholesale distribution network.', ARRAY['National'], ARRAY['Local Producer', 'Eggs'], 1, 'approved', false),
  ('fiskkaup', 'Fiskkaup', 'Fiskkaup', 'Fiskkaup ehf.', 'https://fiskkaup.is/en/', 'info@fiskkaup.is', '+354 520 7300', 'Family business supplying fresh and frozen Icelandic fish.', ARRAY['National'], ARRAY['Fresh Fish', 'Family Business'], 1, 'approved', true),
  ('iceland-seafood', 'Iceland Seafood', 'Iceland Seafood', 'Iceland Seafood hf.', 'https://www.icelandseafood.com/', NULL, '+354 550 0100', 'Global seafood company with Iceland HQ.', ARRAY['National'], ARRAY['International', 'Processing'], 2, 'approved', true),
  ('brim', 'Brim', 'Brim', 'Brim hf.', 'https://brim.is/', NULL, '+354 545 9700', 'Major fisheries company with catching, processing and distribution.', ARRAY['National'], ARRAY['Vertically Integrated'], 2, 'approved', true),
  ('svn', 'SVN', 'Síldarvinnslan', 'Síldarvinnslan hf.', 'https://svn.is/', NULL, '+354 470 3000', 'Large seafood producer specializing in pelagic and groundfish.', ARRAY['National'], ARRAY['Pelagic Fish'], 2, 'approved', false),
  ('vsv', 'VSV', 'Vinnslustöðin', 'Vinnslustöðin (VSV)', 'https://vsv.is/', NULL, '+354 488 8000', 'Seafood processor in Vestmannaeyjar.', ARRAY['South Iceland'], ARRAY['Island Producer'], 2, 'approved', false),
  ('isfelag', 'Ísfélag Vestmannaeyja', 'Ísfélag Vestmannaeyja', 'Ísfélag Vestmannaeyja hf.', 'https://isfelag.is/', NULL, '+354 481 1600', 'Seafood processing and cold storage company.', ARRAY['South Iceland'], ARRAY['Cold Storage'], 2, 'approved', false),
  ('kjoris', 'Kjörís', 'Kjörís', 'Kjörís ehf.', 'https://kjoris.is/', 'kjoris@kjoris.is', '+354 488 5000', 'Ice cream and frozen dessert producer.', ARRAY['National'], ARRAY['Ice Cream', 'Local Producer'], 2, 'approved', true),
  ('noi-sirius', 'Nói Síríus', 'Nói Síríus', 'Nói Síríus hf.', 'https://noi.is/', NULL, '+354 575 5600', 'Iceland''s leading confectionery manufacturer.', ARRAY['National'], ARRAY['Confectionery', 'National Brand'], 1, 'approved', true),
  ('goa', 'Góa', 'Góa Sælgætisgerð', 'Góa sælgætisgerð ehf.', 'https://goa.is/', NULL, NULL, 'Chocolate and candy maker.', ARRAY['National'], ARRAY['Artisan', 'Chocolate'], 2, 'approved', false),
  ('heilsa-lifsstill', 'Heilsa & Lífsstíll', 'Heilsa & Lífsstíll', 'Heilsa & Lífsstíll ehf.', 'https://heilsan.is/', NULL, NULL, 'B2B importer and distributor of health food and organic brands.', ARRAY['National'], ARRAY['Organic', 'Health Foods'], 3, 'approved', false),
  ('omax', 'Omax', 'Omax Heildverslun', 'Omax heildverslun ehf.', 'https://omax.is/', NULL, NULL, 'Family-run wholesaler specializing in healthy snack lines.', ARRAY['National'], ARRAY['Family Business', 'Healthy Snacks'], 2, 'approved', false),
  ('ccep', 'Coca-Cola Iceland', 'Coca-Cola Europacific Partners', 'Coca‑Cola Europacific Partners Ísland', 'https://www.ccep.com/', NULL, NULL, 'Producer and distributor of Coca-Cola system beverages in Iceland.', ARRAY['National'], ARRAY['International Brand', 'Beverages'], 1, 'approved', true),
  ('te-kaffi', 'Te & Kaffi', 'Te & Kaffi Heildsala', 'Te & Kaffi ehf.', 'https://teogkaffi.is/', NULL, NULL, 'Coffee roaster and tea importer with wholesale division.', ARRAY['National'], ARRAY['Coffee', 'Local Roaster'], 2, 'approved', true),
  ('kaffitar', 'Kaffitár', 'Kaffitár Heildsala', 'Kaffitár ehf.', 'https://kaffitar.is/', NULL, NULL, 'Icelandic coffee roaster with wholesale beans and equipment.', ARRAY['National'], ARRAY['Coffee', 'Equipment'], 2, 'approved', false),
  ('kornax', 'Myllan - Kornax', 'Myllan - Kornax', 'Kornax ehf.', 'https://kornax.is/', NULL, NULL, 'Iceland''s main flour mill supplying bakeries and foodservice.', ARRAY['National'], ARRAY['Flour Mill', 'Essential Supplier'], 2, 'approved', true),
  ('bako-ingredients', 'Bako Ingredients', 'Bako Ísberg Ingredients', 'Bako Ísberg ehf.', 'https://bako.is/', NULL, NULL, 'Comprehensive supplier of bakery ingredients and packaging.', ARRAY['National'], ARRAY['Bakery', 'Ingredients'], 2, 'approved', false),
  ('bvt', 'BVT', 'Bako Verslunartækni', 'BVT - Bako Verslunartækni ehf.', 'https://bvt.is/', NULL, NULL, 'Foodservice equipment and service provider.', ARRAY['National'], ARRAY['Equipment', 'Service'], 3, 'approved', false),
  ('matfang', 'Matfang', 'Matfang', 'Matfang ehf.', 'https://veitingageirinn.is/matfang-er-ny-heildsala-fyrir-veitingamarkadinn-og-verslanir/', NULL, NULL, 'Newer wholesaler for HORECA and retail shops.', ARRAY['National'], ARRAY['HORECA', 'Specialty'], 3, 'approved', false)
ON CONFLICT (id) DO NOTHING;

-- Map suppliers to categories using slug lookups
INSERT INTO supplier_categories (supplier_id, category_id)
SELECT mapping.supplier_id, cat.id
FROM (VALUES
  ('innnes', 'food-beverage'),
  ('nathan-olsen', 'food-beverage'),
  ('islensk-dreifing', 'food-beverage'),
  ('islensk-dreifing', 'confectionery'),
  ('hb-heildverslun', 'food-beverage'),
  ('hb-heildverslun', 'health-organic'),
  ('danco', 'food-beverage'),
  ('bako-isberg', 'bakery-supplies'),
  ('bako-isberg', 'food-beverage'),
  ('sfg', 'food-beverage'),
  ('ss', 'meat-poultry'),
  ('ss', 'food-beverage'),
  ('kn', 'meat-poultry'),
  ('kn', 'food-beverage'),
  ('ali', 'meat-poultry'),
  ('ali', 'food-beverage'),
  ('kjarnafaedi', 'meat-poultry'),
  ('kjarnafaedi', 'food-beverage'),
  ('ms', 'dairy'),
  ('ms', 'food-beverage'),
  ('ks', 'dairy'),
  ('ks', 'meat-poultry'),
  ('ks', 'food-beverage'),
  ('brunegg', 'eggs'),
  ('brunegg', 'food-beverage'),
  ('fiskkaup', 'seafood'),
  ('fiskkaup', 'food-beverage'),
  ('iceland-seafood', 'seafood'),
  ('iceland-seafood', 'food-beverage'),
  ('brim', 'seafood'),
  ('brim', 'food-beverage'),
  ('svn', 'seafood'),
  ('svn', 'food-beverage'),
  ('vsv', 'seafood'),
  ('vsv', 'food-beverage'),
  ('isfelag', 'seafood'),
  ('isfelag', 'food-beverage'),
  ('kjoris', 'ice-cream'),
  ('kjoris', 'food-beverage'),
  ('noi-sirius', 'confectionery'),
  ('noi-sirius', 'food-beverage'),
  ('goa', 'confectionery'),
  ('goa', 'food-beverage'),
  ('heilsa-lifsstill', 'health-organic'),
  ('heilsa-lifsstill', 'food-beverage'),
  ('omax', 'health-organic'),
  ('omax', 'food-beverage'),
  ('ccep', 'food-beverage'),
  ('te-kaffi', 'coffee-tea'),
  ('te-kaffi', 'food-beverage'),
  ('kaffitar', 'coffee-tea'),
  ('kaffitar', 'food-beverage'),
  ('kornax', 'bakery-supplies'),
  ('kornax', 'food-beverage'),
  ('bako-ingredients', 'bakery-supplies'),
  ('bako-ingredients', 'food-beverage'),
  ('bvt', 'bakery-supplies'),
  ('bvt', 'food-beverage'),
  ('matfang', 'food-beverage')
) AS mapping(supplier_id, cat_slug)
JOIN categories cat ON cat.slug = mapping.cat_slug
ON CONFLICT DO NOTHING;