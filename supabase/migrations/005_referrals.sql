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
