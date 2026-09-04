-- ============================================================================
-- FamilyPicks — esquema inicial
-- Producto: servicio de predicciones deportivas de UN ÚNICO tipster.
-- Planes: free / premium / vip.
--   · Los picks 'pending' solo los ven premium/vip al instante.
--   · Free y visitantes los ven 24 h después de publicarse.
--   · Los picks ya resueltos son SIEMPRE públicos (track record abierto).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role          as enum ('user', 'admin');
create type public.plan_tier          as enum ('free', 'premium', 'vip');
create type public.pick_status        as enum ('pending', 'won', 'lost', 'void', 'cancelled');
create type public.market_category    as enum ('goals_lines','handicap','moneyline','btts','totals','player_props','other');
create type public.subscription_status as enum ('active','trialing','past_due','canceled','incomplete','incomplete_expired');

-- ---------------------------------------------------------------------------
-- sports (lookup) — editable por el admin sin migración
-- ---------------------------------------------------------------------------
create table public.sports (
  id         smallint generated always as identity primary key,
  slug       text     not null unique,
  name       text     not null,
  icon       text     not null default 'activity',   -- nombre de icono (lucide)
  sort_order smallint not null default 100,
  is_active  boolean  not null default true
);
comment on table public.sports is 'Catálogo de deportes. El admin lo edita desde la app.';

-- ---------------------------------------------------------------------------
-- profiles — 1:1 con auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null default 'Usuario',
  role            public.user_role not null default 'user',
  plan            public.plan_tier not null default 'free',
  plan_renews_at  timestamptz,
  age_verified_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on column public.profiles.role is 'user | admin. El tipster es admin. Solo un admin puede cambiar este campo.';
comment on column public.profiles.plan is 'Plan efectivo. Lo sincroniza un trigger desde public.subscriptions. No editar a mano (salvo admin).';
comment on column public.profiles.age_verified_at is 'Momento en que el usuario confirmó ser mayor de 18. NULL = sin verificar.';

-- ---------------------------------------------------------------------------
-- picks — predicciones publicadas por el tipster
-- ---------------------------------------------------------------------------
create table public.picks (
  id              uuid primary key default gen_random_uuid(),
  sport_id        smallint not null references public.sports(id),
  competition     text not null,
  event           text not null,
  market          text not null,
  market_category public.market_category not null default 'other',
  selection       text not null,
  odds            numeric(6,3) not null check (odds > 1),
  closing_odds    numeric(6,3) check (closing_odds > 1),
  stake           smallint not null check (stake between 1 and 10),
  confidence      smallint check (confidence between 1 and 5),
  event_start_at  timestamptz not null,
  published_at    timestamptz not null default now(),
  status          public.pick_status not null default 'pending',
  result_units    numeric(8,2),
  settled_at      timestamptz,
  analysis        text,
  is_vip          boolean not null default false,   -- pick reservado al plan VIP
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint picks_settled_consistency check (
    (status = 'pending' and result_units is null and settled_at is null)
    or (status <> 'pending' and settled_at is not null)
  )
);
comment on table public.picks is 'Predicciones del tipster (admin). La RLS controla la visibilidad por plan y antigüedad.';
comment on column public.picks.closing_odds is 'Cuota de cierre registrada al liquidar. Prueba de que había valor.';
comment on column public.picks.result_units is 'P&L en unidades. Lo calcula el trigger picks_compute_result al liquidar.';

create index picks_status_idx       on public.picks (status);
create index picks_published_at_idx on public.picks (published_at desc);
create index picks_event_start_idx  on public.picks (event_start_at desc);
create index picks_sport_idx        on public.picks (sport_id);
create index picks_settled_at_idx   on public.picks (settled_at desc) where settled_at is not null;

-- ---------------------------------------------------------------------------
-- pick_saves — picks guardados por el usuario
-- ---------------------------------------------------------------------------
create table public.pick_saves (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  pick_id    uuid not null references public.picks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pick_id)
);

-- ---------------------------------------------------------------------------
-- subscriptions — fuente de verdad de los planes de pago
-- La escribe SOLO service_role (webhook de Stripe). Un trigger sincroniza
-- profiles.plan. Stripe se integra más adelante; el modelo ya está listo.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  plan                     public.plan_tier not null check (plan in ('premium','vip')),
  status                   public.subscription_status not null default 'incomplete',
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  provider                 text not null default 'stripe',
  provider_customer_id     text,
  provider_subscription_id text unique,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
comment on table public.subscriptions is 'Suscripciones de pago. Escritura solo service_role. Sincroniza profiles.plan por trigger.';

create index subscriptions_user_idx on public.subscriptions (user_id);
create unique index subscriptions_one_active_per_user
  on public.subscriptions (user_id)
  where status in ('active','trialing');
