-- ============================================================================
-- FamilyPicks — funciones y triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger picks_set_updated_at
  before update on public.picks
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rol / plan del solicitante (usadas por la RLS)
-- security definer => evitan recursión de políticas sobre profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.auth_plan()
returns public.plan_tier
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select plan from public.profiles where id = auth.uid()),
    'free'
  )::public.plan_tier;
$$;

-- ---------------------------------------------------------------------------
-- Alta de usuario: crea su profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Proteger role / plan de ediciones que no sean de un admin
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.role           := old.role;
  new.plan           := old.plan;
  new.plan_renews_at := old.plan_renews_at;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Cálculo del resultado del pick al liquidar
--   won  -> stake * (odds - 1)
--   lost -> -stake
--   void / cancelled -> 0
-- ---------------------------------------------------------------------------
create or replace function public.picks_compute_result()
returns trigger
language plpgsql as $$
begin
  -- pick sin liquidar: sin resultado
  if new.status = 'pending' then
    new.result_units := null;
    new.settled_at   := null;
    return new;
  end if;

  -- update que no toca el estado: no recalcular (se conserva result_units)
  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  -- liquidación (insert ya liquidado, o transición desde 'pending')
  new.settled_at := coalesce(new.settled_at, now());
  new.result_units := case new.status
    when 'won'  then round(new.stake * (new.odds - 1), 2)
    when 'lost' then (-new.stake)::numeric
    else 0
  end;
  return new;
end;
$$;

create trigger picks_compute_result
  before insert or update on public.picks
  for each row execute function public.picks_compute_result();

-- ---------------------------------------------------------------------------
-- settle_pick — RPC para liquidar un pick (solo admin)
-- ---------------------------------------------------------------------------
create or replace function public.settle_pick(
  p_pick_id      uuid,
  p_status       public.pick_status,
  p_closing_odds numeric default null
)
returns public.picks
language plpgsql security definer set search_path = public as $$
declare
  r public.picks;
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede liquidar picks' using errcode = '42501';
  end if;
  if p_status not in ('won','lost','void','cancelled') then
    raise exception 'Estado de liquidación no válido: %', p_status;
  end if;

  update public.picks
     set status       = p_status,
         closing_odds = coalesce(p_closing_odds, closing_odds)
   where id = p_pick_id
  returning * into r;

  if not found then
    raise exception 'Pick % no encontrado', p_pick_id;
  end if;
  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- verify_age — el usuario confirma ser mayor de 18
-- ---------------------------------------------------------------------------
create or replace function public.verify_age()
returns void
language sql security definer set search_path = public as $$
  update public.profiles
     set age_verified_at = now()
   where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- sync_user_plan — recalcula profiles.plan desde subscriptions
-- vip gana a premium; sin suscripción activa => free
-- ---------------------------------------------------------------------------
create or replace function public.sync_user_plan()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_plan public.plan_tier;
  v_end  timestamptz;
begin
  select s.plan, s.current_period_end
    into v_plan, v_end
  from public.subscriptions s
  where s.user_id = v_user
    and s.status in ('active','trialing')
  order by (s.plan = 'vip') desc, s.current_period_end desc nulls last
  limit 1;

  update public.profiles
     set plan           = coalesce(v_plan, 'free'),
         plan_renews_at  = case when v_plan is null then null else v_end end
   where id = v_user;

  return null;
end;
$$;

create trigger subscriptions_sync_plan
  after insert or update or delete on public.subscriptions
  for each row execute function public.sync_user_plan();
