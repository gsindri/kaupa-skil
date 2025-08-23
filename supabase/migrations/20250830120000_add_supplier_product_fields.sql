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
  sp.pack_size,
  sp.availability_text,
  sp.image_url,
  count(distinct sp.supplier_id) as supplier_count
from public.catalog_product c
left join public.supplier_product sp on sp.catalog_id = c.catalog_id
group by c.catalog_id, c.name, c.brand, c.size, c.gtin, c.image_main,
         sp.pack_size, sp.availability_text, sp.image_url;
