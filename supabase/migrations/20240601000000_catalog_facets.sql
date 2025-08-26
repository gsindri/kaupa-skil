-- Catalog facets view and RPC for filtering
create or replace view public.catalog_facets as
select
  cp.catalog_id,
  cp.name,
  cp.brand,
  cp.category_id,
  cat.name as category_name,
  sp.supplier_id,
  sup.name as supplier_name,
  o.availability,
  case
    when nullif(regexp_replace(sp.pack_size, '[^0-9.]', '', 'g'), '') is null then 'unknown'
    when (nullif(regexp_replace(sp.pack_size, '[^0-9.]', '', 'g'), '')::numeric) <= 5 then '1-5'
    when (nullif(regexp_replace(sp.pack_size, '[^0-9.]', '', 'g'), '')::numeric) <= 10 then '6-10'
    when (nullif(regexp_replace(sp.pack_size, '[^0-9.]', '', 'g'), '')::numeric) <= 20 then '11-20'
    else '21+'
  end as pack_size_range
from public.catalog_product cp
left join public.categories cat on cat.id = cp.category_id
left join public.supplier_product sp on sp.catalog_id = cp.catalog_id
left join public.suppliers sup on sup.id = sp.supplier_id
left join public.offer o on o.supplier_product_id = sp.supplier_product_id;

create or replace function public.fetch_catalog_facets(
  _search text default null,
  _category_ids uuid[] default null,
  _supplier_ids uuid[] default null,
  _availability text[] default null,
  _pack_size_ranges text[] default null,
  _brands text[] default null
) returns table (facet text, id text, name text, count bigint)
language sql stable as $$
  with base as (
    select * from public.catalog_facets
    where (_search is null or name ilike '%' || _search || '%')
      and (_category_ids is null or category_id = any(_category_ids))
      and (_supplier_ids is null or supplier_id = any(_supplier_ids))
      and (_availability is null or availability = any(_availability))
      and (_pack_size_ranges is null or pack_size_range = any(_pack_size_ranges))
      and (_brands is null or brand = any(_brands))
  )
  select 'category' as facet, category_id::text as id, max(category_name) as name, count(distinct catalog_id) as count
    from base where category_id is not null group by category_id
  union all
  select 'supplier', supplier_id::text, max(supplier_name), count(distinct catalog_id)
    from base where supplier_id is not null group by supplier_id
  union all
  select 'availability', availability, availability, count(distinct catalog_id)
    from base where availability is not null group by availability
  union all
  select 'pack_size_range', pack_size_range, pack_size_range, count(distinct catalog_id)
    from base where pack_size_range is not null group by pack_size_range
  union all
  select 'brand', brand, brand, count(distinct catalog_id)
    from base where brand is not null group by brand;
$$;
