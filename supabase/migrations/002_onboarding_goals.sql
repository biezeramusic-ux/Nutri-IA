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
