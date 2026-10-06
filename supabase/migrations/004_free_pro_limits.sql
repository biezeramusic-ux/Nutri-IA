-- Nutri IA · planos FREE / PRO, fibras, peso e atividade física.
-- Execute DEPOIS de 001, 002 e 003. É seguro correr mais de uma vez.
--
-- FREE (3 dias de teste): 2 análises de refeição por dia e até 5 registos de refeição NO TOTAL.
-- PRO: tudo ilimitado. Os limites são aplicados AQUI, no servidor.

-- ============================================================================
-- 1. FIBRAS NAS REFEIÇÕES
-- ============================================================================

alter table public.meals
  add column if not exists fiber_g numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'meals_fiber_check') then
    alter table public.meals add constraint meals_fiber_check check (fiber_g is null or fiber_g >= 0);
  end if;
end $$;

-- ============================================================================
-- 2. PESO, ATIVIDADE FÍSICA E PASSOS
-- ============================================================================

create table if not exists public.weight_logs (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day       date not null,
  weight_kg numeric not null check (weight_kg between 30 and 300),
  primary key (user_id, day)
);

create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  type       text not null,
  minutes    int  not null check (minutes between 1 and 600),
  kcal       int  not null check (kcal between 0 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_user_day_idx on public.activity_logs (user_id, day);

create table if not exists public.daily_steps (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day     date not null,
  steps   int  not null check (steps between 0 and 100000),
  primary key (user_id, day)
);

alter table public.weight_logs   enable row level security;
alter table public.activity_logs enable row level security;
alter table public.daily_steps   enable row level security;

drop policy if exists weight_logs_own on public.weight_logs;
create policy weight_logs_own on public.weight_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists activity_logs_own on public.activity_logs;
create policy activity_logs_own on public.activity_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists daily_steps_own on public.daily_steps;
create policy daily_steps_own on public.daily_steps
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 3. ESTADO DE ACESSO: acrescenta os registos de refeição restantes (total do teste)
-- ============================================================================

create or replace function public.access_snapshot(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c_trial_days constant int := 3;
  c_daily_scans constant int := 2;
  c_free_meals constant int := 5;
  v_profile  public.profiles;
  v_today    date := (now() at time zone 'Africa/Maputo')::date;
  v_premium  boolean;
  v_trial    int;
  v_used     int;
  v_left     int;
  v_meals    int;
  v_reason   text;
begin
  select * into v_profile from public.profiles where id = p_uid;
  if not found then
    raise exception 'profile_not_found';
  end if;

  v_premium := v_profile.plan_expires_at is not null and v_profile.plan_expires_at > now();
  v_trial   := greatest(0, c_trial_days - floor(extract(epoch from (now() - v_profile.trial_started_at)) / 86400)::int);

  select count into v_used from public.daily_scans where user_id = p_uid and day = v_today;
  v_used := coalesce(v_used, 0);
  v_left := greatest(0, c_daily_scans - v_used);

  select count(*) into v_meals from public.meals where user_id = p_uid;

  if v_premium then
    v_reason := null;
  elsif v_trial = 0 then
    v_reason := 'trial_expired';
  elsif v_left = 0 then
    v_reason := 'daily_limit';
  end if;

  return jsonb_build_object(
    'is_premium',        v_premium,
    'trial_days_left',   v_trial,
    'scans_left_today',  case when v_premium then null else v_left end,
    'meals_left',        case when v_premium then null else greatest(0, c_free_meals - v_meals) end,
    'lock_reason',       v_reason
  );
end;
$$;

-- ============================================================================
-- 4. LIMITE DE REGISTOS DE REFEIÇÃO (FREE: 5 no total, só durante o teste)
-- ============================================================================

create or replace function public.enforce_meal_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c_trial_days constant int := 3;
  c_free_meals constant int := 5;
  v_profile public.profiles;
  v_count   int;
begin
  select * into v_profile from public.profiles where id = new.user_id;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_profile.plan_expires_at is not null and v_profile.plan_expires_at > now() then
    return new; -- PRO: sem limites
  end if;

  if c_trial_days - floor(extract(epoch from (now() - v_profile.trial_started_at)) / 86400)::int <= 0 then
    raise exception 'trial_expired';
  end if;

  select count(*) into v_count from public.meals where user_id = new.user_id;
  if v_count >= c_free_meals then
    raise exception 'meal_limit_reached';
  end if;

  return new;
end;
$$;

drop trigger if exists meals_enforce_limit on public.meals;
create trigger meals_enforce_limit
  before insert on public.meals
  for each row execute function public.enforce_meal_limit();
