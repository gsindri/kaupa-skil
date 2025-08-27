-- Add availability and image columns to supplier_product
ALTER TABLE public.supplier_product
  ADD COLUMN IF NOT EXISTS pack_size text,
  ADD COLUMN IF NOT EXISTS availability_text text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Expose new fields via public catalog view
create or replace view public.v_public_catalog as
select
  c.catalog_id,
  c.name,
  c.brand,
  c.size,
  c.gtin,
  c.image_main,
  max(sp.pack_size) as pack_size,
  max(sp.availability_text) as availability_text,
  max(sp.image_url) as image_url,
  count(distinct sp.supplier_id) as supplier_count,
  array_agg(distinct s.name) filter (where s.name is not null) as supplier_names
from public.catalog_product c
left join public.supplier_product sp on sp.catalog_id = c.catalog_id
left join public.suppliers s on s.id = sp.supplier_id
group by c.catalog_id, c.name, c.brand, c.size, c.gtin, c.image_main;
