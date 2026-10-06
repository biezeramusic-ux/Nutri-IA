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
