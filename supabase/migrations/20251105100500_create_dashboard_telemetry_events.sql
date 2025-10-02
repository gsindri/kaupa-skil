-- Capture dashboard interaction telemetry for adoption metrics
create table if not exists public.dashboard_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.tenants(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dashboard_telemetry_events enable row level security;

create policy if not exists "Users can insert telemetry events"
  on public.dashboard_telemetry_events
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy if not exists "Users can read own telemetry"
  on public.dashboard_telemetry_events
  for select
  using (user_id = auth.uid());

create policy if not exists "Service role can manage telemetry"
  on public.dashboard_telemetry_events
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_dashboard_telemetry_event_name
  on public.dashboard_telemetry_events (event_name);

create index if not exists idx_dashboard_telemetry_created_at
  on public.dashboard_telemetry_events (created_at desc);
