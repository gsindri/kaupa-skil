-- Dashboard layouts persisted per user/workspace/preset
create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.tenants(id) on delete cascade,
  preset_name text not null,
  widgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workspace_id, preset_name)
);

alter table public.dashboard_layouts enable row level security;

create policy if not exists "Users manage their dashboard layouts"
  on public.dashboard_layouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Service role can manage dashboard layouts"
  on public.dashboard_layouts
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_dashboard_layouts_lookup
  on public.dashboard_layouts (user_id, workspace_id, preset_name);

create trigger if not exists update_dashboard_layouts_updated_at
  before update on public.dashboard_layouts
  for each row execute function public.update_updated_at_column();
