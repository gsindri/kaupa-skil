-- Add availability summary fields to public catalog view
create or replace view public.v_public_catalog as
select
  c.catalog_id,
  c.name,
  c.brand,
  c.size,
  c.gtin,
  c.image_main,
  max(sp.pack_size) as pack_size,
  string_agg(distinct sp.availability_text, '; ') filter (where sp.availability_text is not null) as availability_text,
  case
    when bool_or(o.availability = 'IN_STOCK') then 'IN_STOCK'
    when bool_or(o.availability = 'OUT_OF_STOCK') then 'OUT_OF_STOCK'
    when bool_or(o.availability = 'UNKNOWN') then 'UNKNOWN'
    else null
  end as availability_status,
  max(o.updated_at) as availability_updated_at,
  max(sp.image_url) as image_url,
  count(distinct sp.supplier_id) as suppliers_count,
  array_agg(distinct s.name) filter (where s.name is not null) as supplier_names
from public.catalog_product c
left join public.supplier_product sp on sp.catalog_id = c.catalog_id
left join public.offer o on o.supplier_product_id = sp.supplier_product_id
left join public.suppliers s on s.id = sp.supplier_id
group by c.catalog_id, c.name, c.brand, c.size, c.gtin, c.image_main;
