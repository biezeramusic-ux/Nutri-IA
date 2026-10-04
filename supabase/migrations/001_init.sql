-- Nutri AI · esquema inicial (Supabase / PostgreSQL)
-- Cole este ficheiro inteiro no SQL Editor do Supabase e execute.
-- É idempotente nas partes seguras (create ... if not exists / create or replace).

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

-- Perfis (1:1 com auth.users). O teste grátis começa no registo.
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text not null default '',
  trial_started_at timestamptz not null default now(),
  plan             text check (plan in ('weekly', 'monthly', 'yearly')),
  plan_expires_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- Refeições (histórico "Last Scans")
create table if not exists public.meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  food_name   text not null,
  weight_g    numeric not null check (weight_g >= 0),
  calories    numeric not null check (calories >= 0),
  carbs_g     numeric not null check (carbs_g >= 0),
  protein_g   numeric not null check (protein_g >= 0),
  fats_g      numeric not null check (fats_g >= 0),
  ingredients jsonb not null default '[]'::jsonb,   -- [{ name, grams, icon }]
  photo_path  text,                                  -- caminho no bucket meal-photos
  created_at  timestamptz not null default now()
);
create index if not exists meals_user_created_idx on public.meals (user_id, created_at desc);

-- Contagem diária de scans (limite do teste grátis). Escrita só pela RPC.
create table if not exists public.daily_scans (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  count   int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);

-- Hidratação
create table if not exists public.water_logs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day     date not null,
  glasses int  not null default 0 check (glasses between 0 and 20),
  primary key (user_id, day)
);

-- Jejum intermitente (ended_at nulo = em curso)
create table if not exists public.fasting_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  goal_hours int not null default 16 check (goal_hours between 1 and 72)
);
create unique index if not exists one_active_fast
  on public.fasting_sessions (user_id) where ended_at is null;

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.meals            enable row level security;
alter table public.daily_scans      enable row level security;
alter table public.water_logs       enable row level security;
alter table public.fasting_sessions enable row level security;

-- profiles: lê o próprio; só pode alterar full_name (ver privilégios por coluna abaixo)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- meals
drop policy if exists meals_select_own on public.meals;
create policy meals_select_own on public.meals
  for select to authenticated using (user_id = auth.uid());

drop policy if exists meals_insert_own on public.meals;
create policy meals_insert_own on public.meals
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists meals_delete_own on public.meals;
create policy meals_delete_own on public.meals
  for delete to authenticated using (user_id = auth.uid());

-- daily_scans: só leitura para o cliente
drop policy if exists daily_scans_select_own on public.daily_scans;
create policy daily_scans_select_own on public.daily_scans
  for select to authenticated using (user_id = auth.uid());

-- water_logs
drop policy if exists water_logs_own on public.water_logs;
create policy water_logs_own on public.water_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- fasting_sessions
drop policy if exists fasting_sessions_own on public.fasting_sessions;
create policy fasting_sessions_own on public.fasting_sessions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 3. PRIVILÉGIOS POR COLUNA / TABELA (defesa em profundidade)
-- ============================================================================

-- O cliente nunca escreve em profiles exceto full_name (senão daria premium a si próprio).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- O cliente nunca escreve em daily_scans (só a RPC consume_scan).
revoke insert, update, delete on public.daily_scans from anon, authenticated;

-- ============================================================================
-- 4. TRIGGER: cria o perfil ao registar
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. RPCs DE ACESSO (teste grátis: 3 dias, 2 scans/dia, dia em Africa/Maputo)
-- ============================================================================

-- Função interna: calcula o estado de acesso. Não é exposta ao cliente.
create or replace function public.access_snapshot(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c_trial_days constant int := 3;
  c_daily_limit constant int := 2;
  v_profile  public.profiles;
  v_today    date := (now() at time zone 'Africa/Maputo')::date;
  v_premium  boolean;
  v_trial    int;
  v_used     int;
  v_left     int;
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
  v_left := greatest(0, c_daily_limit - v_used);

  if v_premium then
    v_reason := null;
  elsif v_trial = 0 then
    v_reason := 'trial_expired';
  elsif v_left = 0 then
    v_reason := 'daily_limit';
  end if;

  return jsonb_build_object(
    'is_premium',       v_premium,
    'trial_days_left',  v_trial,
    'scans_left_today', case when v_premium then null else v_left end,
    'lock_reason',      v_reason
  );
end;
$$;

revoke all on function public.access_snapshot(uuid) from public, anon, authenticated;

-- Estado de acesso do utilizador autenticado (só leitura).
create or replace function public.get_access_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  return public.access_snapshot(auth.uid());
end;
$$;

-- Consome um scan de forma atómica. Chamar ANTES da chamada à IA.
create or replace function public.consume_scan()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_today    date := (now() at time zone 'Africa/Maputo')::date;
  v_snapshot jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Bloqueia a linha do perfil: serializa pedidos concorrentes do mesmo utilizador.
  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  v_snapshot := public.access_snapshot(v_uid);
  if v_snapshot ->> 'lock_reason' is not null then
    return v_snapshot || jsonb_build_object('allowed', false);
  end if;

  insert into public.daily_scans (user_id, day, count)
  values (v_uid, v_today, 1)
  on conflict (user_id, day) do update set count = public.daily_scans.count + 1;

  return public.access_snapshot(v_uid) || jsonb_build_object('allowed', true);
end;
$$;

-- Ativa um plano. ⚠️ SIMULADO (DEV): enquanto os pagamentos forem stubs, esta função
-- só funciona se a base de dados tiver app.allow_dev_activation = 'true'.
-- Em produção, deixe desligado e ative planos via webhook (service_role) do
-- M-Pesa / e-Mola / gateway de cartões.
create or replace function public.activate_plan(p_plan text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_days int;
  v_base timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if coalesce(current_setting('app.allow_dev_activation', true), 'false') <> 'true' then
    raise exception 'dev_activation_disabled';
  end if;

  v_days := case p_plan when 'weekly' then 7 when 'monthly' then 30 when 'yearly' then 365 end;
  if v_days is null then
    raise exception 'invalid_plan';
  end if;

  select greatest(coalesce(plan_expires_at, now()), now()) into v_base
  from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  update public.profiles
     set plan = p_plan,
         plan_expires_at = v_base + make_interval(days => v_days)
   where id = v_uid;

  return public.access_snapshot(v_uid);
end;
$$;

revoke all on function public.get_access_status() from public, anon;
revoke all on function public.consume_scan()      from public, anon;
revoke all on function public.activate_plan(text) from public, anon;
grant execute on function public.get_access_status() to authenticated;
grant execute on function public.consume_scan()      to authenticated;
grant execute on function public.activate_plan(text) to authenticated;

-- ============================================================================
-- 6. STORAGE: bucket privado para as fotos (já comprimidas, < 300 KB)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 524288, array['image/jpeg'])
on conflict (id) do nothing;

-- Cada utilizador só acede à pasta com o seu uid: meal-photos/<uid>/ficheiro.jpg
drop policy if exists meal_photos_select_own on storage.objects;
create policy meal_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists meal_photos_insert_own on storage.objects;
create policy meal_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists meal_photos_delete_own on storage.objects;
create policy meal_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
