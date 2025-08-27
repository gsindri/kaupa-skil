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
