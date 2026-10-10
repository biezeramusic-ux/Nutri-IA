-- Nutri IA · esquema inicial (Supabase / PostgreSQL)
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
-- 6. STORAGE: bucket privado para as fotos (comprimidas a ~50 KB)
-- ============================================================================

-- Fotos arquivadas a ~50 KB (a app comprime antes de enviar); limite de 100 KB por segurança.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 102400, array['image/jpeg'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

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
-- Nutri IA · quiz inicial, metas diárias e lembretes de água.
-- Execute DEPOIS de 001_init.sql (SQL Editor do Supabase). É seguro correr mais de uma vez.

-- ============================================================================
-- 1. NOVAS COLUNAS EM profiles
-- ============================================================================

alter table public.profiles
  add column if not exists goal                 text,
  add column if not exists sex                  text,
  add column if not exists age                  int,
  add column if not exists height_cm            numeric,
  add column if not exists weight_kg            numeric,
  add column if not exists target_weight_kg     numeric,
  add column if not exists activity_level       text,
  add column if not exists diet_preferences     text[] not null default '{}',
  add column if not exists daily_calorie_goal   int,
  add column if not exists protein_goal_g       int,
  add column if not exists carbs_goal_g         int,
  add column if not exists fats_goal_g          int,
  add column if not exists water_goal_ml        int,
  add column if not exists water_reminders      boolean not null default true,
  add column if not exists wake_hour            int not null default 7,
  add column if not exists sleep_hour           int not null default 22,
  add column if not exists onboarding_completed_at timestamptz;

-- Validações (só se ainda não existirem)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_goal_check') then
    alter table public.profiles add constraint profiles_goal_check
      check (goal is null or goal in ('lose_weight','maintain','gain_muscle','eat_healthy','track_calories'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_sex_check') then
    alter table public.profiles add constraint profiles_sex_check
      check (sex is null or sex in ('male','female'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_activity_check') then
    alter table public.profiles add constraint profiles_activity_check
      check (activity_level is null or activity_level in ('sedentary','light','moderate','very_active'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_ranges_check') then
    alter table public.profiles add constraint profiles_ranges_check check (
      (age is null or age between 10 and 100)
      and (height_cm is null or height_cm between 100 and 250)
      and (weight_kg is null or weight_kg between 30 and 300)
      and (target_weight_kg is null or target_weight_kg between 30 and 300)
      and (daily_calorie_goal is null or daily_calorie_goal between 800 and 6000)
      and (water_goal_ml is null or water_goal_ml between 500 and 8000)
      and wake_hour between 0 and 23
      and sleep_hour between 1 and 24
    );
  end if;
end $$;

-- ============================================================================
-- 2. PRIVILÉGIOS: o cliente pode editar o quiz, metas e lembretes,
--    mas continua sem poder tocar em trial_started_at / plan / plan_expires_at.
-- ============================================================================

grant update (
  full_name, goal, sex, age, height_cm, weight_kg, target_weight_kg, activity_level,
  diet_preferences, daily_calorie_goal, protein_goal_g, carbs_goal_g, fats_goal_g,
  water_goal_ml, water_reminders, wake_hour, sleep_hour, onboarding_completed_at
) on public.profiles to authenticated;
-- Nutri IA · quiz mais completo (saúde, hábitos, alimentos) e confiança da IA nas refeições.
-- Execute DEPOIS de 001 e 002. É seguro correr mais de uma vez.

alter table public.profiles
  add column if not exists health_conditions text[] not null default '{}',
  add column if not exists habits            jsonb  not null default '{}'::jsonb,
  add column if not exists staples           text[] not null default '{}';

alter table public.meals
  add column if not exists confidence int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'meals_confidence_check') then
    alter table public.meals add constraint meals_confidence_check
      check (confidence is null or confidence between 0 and 100);
  end if;
end $$;

-- O cliente pode editar as respostas do quiz (continua sem poder tocar em plano/teste).
grant update (health_conditions, habits, staples) on public.profiles to authenticated;
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
-- Nutri IA · convites: cada utilizador tem um código; 10 convidados ativos = 5% de desconto em todos os planos.
-- Execute DEPOIS de 001–004. É seguro correr mais de uma vez.

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

-- Código curto e legível (sem 0/O/1/I): NUTRI-XXXXXX
create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := 'NUTRI-';
    for i in 1..6 loop
      v_code := v_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.gen_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- Perfis que já existem passam a ter código.
update public.profiles set referral_code = public.gen_referral_code() where referral_code is null;

create table if not exists public.referrals (
  referred_id uuid primary key references auth.users (id) on delete cascade,
  referrer_id uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

-- Cada pessoa só vê os convites em que participa. Ninguém escreve diretamente: só pela função abaixo.
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select to authenticated using (referrer_id = auth.uid() or referred_id = auth.uid());

revoke insert, update, delete on public.referrals from anon, authenticated;

-- Usa o código de quem convidou. Só contas novas (até 7 dias), uma vez, e nunca o próprio código.
create or replace function public.redeem_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_referrer  uuid;
  v_created   timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select created_at into v_created from public.profiles where id = v_uid;
  if v_created is null or v_created < now() - interval '7 days' then
    return jsonb_build_object('ok', false, 'error', 'too_late');
  end if;

  select id into v_referrer from public.profiles where referral_code = upper(trim(p_code));
  if v_referrer is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;
  if v_referrer = v_uid then
    return jsonb_build_object('ok', false, 'error', 'own_code');
  end if;
  if exists (select 1 from public.referrals where referred_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;

  insert into public.referrals (referred_id, referrer_id) values (v_uid, v_referrer);
  return jsonb_build_object('ok', true);
end;
$$;

-- Código, convidados ativos (concluíram o quiz) e desconto. O desconto é calculado aqui, no servidor.
create or replace function public.get_referral_info()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c_needed constant int := 10;
  c_discount constant int := 5;
  v_uid    uuid := auth.uid();
  v_code   text;
  v_count  int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select referral_code into v_code from public.profiles where id = v_uid;

  select count(*) into v_count
  from public.referrals r
  join public.profiles p on p.id = r.referred_id
  where r.referrer_id = v_uid and p.onboarding_completed_at is not null;

  return jsonb_build_object(
    'code',         v_code,
    'invited',      v_count,
    'needed',       c_needed,
    'discount_pct', case when v_count >= c_needed then c_discount else 0 end
  );
end;
$$;

revoke all on function public.redeem_referral(text) from public, anon;
revoke all on function public.get_referral_info() from public, anon;
grant execute on function public.redeem_referral(text) to authenticated;
grant execute on function public.get_referral_info() to authenticated;
