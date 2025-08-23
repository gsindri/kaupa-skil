create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- supplier_product timestamps + trigger
alter table if exists public.supplier_product
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists update_supplier_product_updated_at on public.supplier_product;
create trigger update_supplier_product_updated_at
  before update on public.supplier_product
  for each row execute function public.update_updated_at_column();

-- Unique guard (supplier_id, supplier_sku)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.supplier_product'::regclass
      and conname = 'supplier_product_supplier_id_supplier_sku_key'
  ) then
    alter table public.supplier_product
      add constraint supplier_product_supplier_id_supplier_sku_key unique (supplier_id, supplier_sku);
  end if;
end $$;

-- FK to catalog_product with CASCADE
alter table public.supplier_product
  drop constraint if exists supplier_product_catalog_id_fkey,
  add constraint supplier_product_catalog_id_fkey
  foreign key (catalog_id) references public.catalog_product (catalog_id)
  on delete cascade;

-- offer trigger
drop trigger if exists update_offer_updated_at on public.offer;
create trigger update_offer_updated_at
  before update on public.offer
  for each row execute function public.update_updated_at_column();

-- Offer RLS policy (pick ONE approach; we’ll use membership-based)
alter table public.offer enable row level security;
drop policy if exists "Offer org isolation" on public.offer;
create policy "Offer org isolation" on public.offer
for select using (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);
-- Add FOR INSERT/UPDATE if you need writes:
create policy "Offer org write" on public.offer
for insert with check (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);
create policy "Offer org update" on public.offer
for update using (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);

-- Helpful indexes
create index if not exists idx_catalog_product_name_trgm
  on public.catalog_product using gin (name gin_trgm_ops);
create index if not exists idx_catalog_product_brand_trgm
  on public.catalog_product using gin (brand gin_trgm_ops);
create index if not exists idx_supplier_product_catalog on public.supplier_product (catalog_id);
create index if not exists idx_offer_supplier_product on public.offer (supplier_product_id);
