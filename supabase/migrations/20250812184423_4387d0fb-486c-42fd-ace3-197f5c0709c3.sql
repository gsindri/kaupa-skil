
-- Enable Row Level Security best-practice helpers
-- Uses gen_random_uuid() which is available by default in Supabase

-- 1) PROFILES: app-accessible mirror of auth.users with optional active tenant
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  tenant_id uuid, -- optional active tenant selector used by has_capability()
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles policies: users can see and edit only their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Trigger to auto-insert profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 2) TENANTS: organizations that can be buyer, supplier, or both
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'buyer' check (kind in ('buyer','supplier','both')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (name)
);

alter table public.tenants enable row level security;

-- Helper to set created_by automatically if not provided
create or replace function public.before_insert_tenant_set_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists before_insert_tenant_set_creator on public.tenants;
create trigger before_insert_tenant_set_creator
  before insert on public.tenants
  for each row
  execute procedure public.before_insert_tenant_set_creator();

-- 3) MEMBERSHIPS: link users to tenants with base_role
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  base_role text check (base_role in ('owner','admin','member')) not null,
  attrs jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, user_id)
);

alter table public.memberships enable row level security;

-- 4) GRANTS: capability-based permissions scoped by tenant/relationship/supplier
create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  capability text not null,
  scope text not null default 'tenant' check (scope in ('tenant','relationship','supplier')),
  scope_id uuid,
  constraints jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.grants enable row level security;

-- 5) Helper function: is_owner
create or replace function public.is_owner(_tenant_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = _tenant_id
      and m.user_id = auth.uid()
      and m.base_role = 'owner'
  );
$$;

-- 6) Capability checker that derives active tenant from profiles.tenant_id (preferred),
--    or from a session setting if provided, or falls back to the first membership.
create or replace function public.has_capability(
  cap text,
  target_scope text,
  target_id uuid default null,
  want jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  mid uuid;
  ok boolean;
  active_tenant uuid;
  setting text;
begin
  -- Prefer profile.tenant_id if set
  select p.tenant_id into active_tenant
  from public.profiles p
  where p.id = auth.uid();

  -- Otherwise, check for a request-scoped setting (optional)
  if active_tenant is null then
    begin
      setting := current_setting('app.tenant_id', true);
      if setting is not null then
        active_tenant := setting::uuid;
      end if;
    exception when others then
      active_tenant := null;
    end;
  end if;

  -- Fallback: first membership's tenant
  if active_tenant is null then
    select m.tenant_id into active_tenant
    from public.memberships m
    where m.user_id = auth.uid()
    limit 1;
  end if;

  if active_tenant is null then
    return false;
  end if;

  -- Locate the membership id
  select m.id into mid
  from public.memberships m
  where m.tenant_id = active_tenant
    and m.user_id = auth.uid();

  if mid is null then
    return false;
  end if;

  -- Owner shortcut
  if exists (
    select 1 from public.memberships where id = mid and base_role = 'owner'
  ) then
    return true;
  end if;

  -- Match a grant by capability + scope (accept NULL scope_id as wildcard)
  select true into ok
  from public.grants g
  where g.membership_id = mid
    and g.capability = cap
    and g.scope = target_scope
    and (g.scope_id is null or g.scope_id = target_id)
  limit 1;

  return coalesce(ok, false);
end
$$;

-- 7) RPC: get all memberships for current user with tenant name
create or replace function public.get_user_memberships()
returns table (
  membership_id uuid,
  tenant_id uuid,
  tenant_name text,
  base_role text,
  attrs jsonb
)
language sql
stable
security definer
as $$
  select 
    m.id as membership_id,
    m.tenant_id,
    t.name as tenant_name,
    m.base_role,
    m.attrs
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid();
$$;

-- 8) Default owner grants to make admin UX easier
create or replace function public.setup_owner_grants(_membership_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  _tenant_id uuid;
begin
  select m.tenant_id into _tenant_id
  from public.memberships m
  where m.id = _membership_id;

  if _tenant_id is null then
    return;
  end if;

  insert into public.grants (tenant_id, membership_id, capability, scope) values
    (_tenant_id, _membership_id, 'manage_tenant_users', 'tenant'),
    (_tenant_id, _membership_id, 'view_prices', 'tenant'),
    (_tenant_id, _membership_id, 'compose_order', 'tenant'),
    (_tenant_id, _membership_id, 'dispatch_order_email', 'tenant'),
    (_tenant_id, _membership_id, 'run_ingestion', 'tenant'),
    (_tenant_id, _membership_id, 'manage_credentials', 'tenant'),
    (_tenant_id, _membership_id, 'manage_supplier_links', 'tenant'),
    (_tenant_id, _membership_id, 'view_price_history', 'tenant'),
    (_tenant_id, _membership_id, 'read_reports', 'tenant'),
    (_tenant_id, _membership_id, 'manage_vat_rules', 'tenant'),
    (_tenant_id, _membership_id, 'read_audit_logs', 'tenant')
  on conflict do nothing;
end;
$$;

-- 9) On tenant creation, auto-owner membership + seed grants
create or replace function public.handle_new_tenant_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_membership_id uuid;
begin
  -- Create Owner membership for creator
  insert into public.memberships (tenant_id, user_id, base_role)
  values (new.id, new.created_by, 'owner')
  on conflict (tenant_id, user_id) do nothing
  returning id into new_membership_id;

  if new_membership_id is not null then
    perform public.setup_owner_grants(new_membership_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_tenant_created_after on public.tenants;
create trigger on_tenant_created_after
  after insert on public.tenants
  for each row
  execute procedure public.handle_new_tenant_after();

-- 10) RLS policies

-- Tenants: users can read tenants they created or belong to; anyone authenticated can create; only owners can update/delete.
drop policy if exists "Users can read their tenants" on public.tenants;
create policy "Users can read their tenants"
  on public.tenants
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid())
  );

drop policy if exists "Users can create tenants" on public.tenants;
create policy "Users can create tenants"
  on public.tenants
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Owners can update tenants" on public.tenants;
create policy "Owners can update tenants"
  on public.tenants
  for update
  to authenticated
  using (public.is_owner(id))
  with check (public.is_owner(id));

drop policy if exists "Owners can delete tenants" on public.tenants;
create policy "Owners can delete tenants"
  on public.tenants
  for delete
  to authenticated
  using (public.is_owner(id));

-- Memberships: user sees own; owners/admins with manage_tenant_users can manage
drop policy if exists "Users can view their own memberships" on public.memberships;
create policy "Users can view their own memberships"
  on public.memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can insert memberships" on public.memberships;
create policy "Tenant admins can insert memberships"
  on public.memberships
  for insert
  to authenticated
  with check (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can update memberships" on public.memberships;
create policy "Tenant admins can update memberships"
  on public.memberships
  for update
  to authenticated
  using (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  )
  with check (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can delete memberships" on public.memberships;
create policy "Tenant admins can delete memberships"
  on public.memberships
  for delete
  to authenticated
  using (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

-- Grants: readable to membership owners; manageable by tenant admins
drop policy if exists "Users can view grants for their memberships" on public.grants;
create policy "Users can view grants for their memberships"
  on public.grants
  for select
  to authenticated
  using (
    exists (select 1 from public.memberships m where m.id = grants.membership_id and m.user_id = auth.uid())
    or public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can insert grants" on public.grants;
create policy "Tenant admins can insert grants"
  on public.grants
  for insert
  to authenticated
  with check (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can update grants" on public.grants;
create policy "Tenant admins can update grants"
  on public.grants
  for update
  to authenticated
  using (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  )
  with check (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

drop policy if exists "Tenant admins can delete grants" on public.grants;
create policy "Tenant admins can delete grants"
  on public.grants
  for delete
  to authenticated
  using (
    public.is_owner(tenant_id)
    or public.has_capability('manage_tenant_users','tenant', tenant_id)
  );

-- 11) Indexes
create index if not exists idx_memberships_user_tenant on public.memberships(user_id, tenant_id);
create index if not exists idx_memberships_tenant on public.memberships(tenant_id);
create index if not exists idx_grants_membership on public.grants(membership_id);
create index if not exists idx_grants_capability_scope on public.grants(capability, scope, scope_id);
