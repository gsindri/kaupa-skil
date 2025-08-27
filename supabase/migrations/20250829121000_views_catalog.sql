-- Public catalog with supplier coverage
create or replace view public.v_public_catalog as
select
  c.catalog_id,
  c.name,
  c.brand,
  c.size,
  c.gtin,
  c.image_main,
  count(distinct sp.supplier_id) as supplier_count,
  array_remove(array_agg(distinct s.name), null) as supplier_names
from public.catalog_product c
left join public.supplier_product sp
  on sp.catalog_id = c.catalog_id
left join public.suppliers s
  on s.id = sp.supplier_id
group by c.catalog_id, c.name, c.brand, c.size, c.gtin, c.image_main;

-- Org-specific catalog: best offer across all supplier_products of a catalog
create or replace function public.v_org_catalog(_org uuid)
returns table (
  catalog_id uuid,
  name text,
  brand text,
  gtin text,
  image_main text,
  supplier_count bigint,
  supplier_names text[],
  best_price numeric,
  currency text
)
language sql stable as $$
  select
    c.catalog_id,
    c.name,
    c.brand,
    c.gtin,
    c.image_main,
    count(distinct sp.supplier_id) as supplier_count,
    array_remove(array_agg(distinct s.name), null) as supplier_names,
    bo.best_price,
    bo.currency
  from public.catalog_product c
  left join public.supplier_product sp
    on sp.catalog_id = c.catalog_id
  left join public.suppliers s
    on s.id = sp.supplier_id
  left join lateral (
    select
      min(o.price) as best_price,
      max(o.currency) as currency
    from public.offer o
    join public.supplier_product sp2
      on sp2.supplier_product_id = o.supplier_product_id
    where sp2.catalog_id = c.catalog_id
      and o.org_id = _org
  ) bo on true
  group by
    c.catalog_id,
    c.name,
    c.brand,
    c.gtin,
    c.image_main,
    bo.best_price,
    bo.currency;
$$;
