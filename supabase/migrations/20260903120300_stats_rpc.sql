-- ============================================================================
-- FamilyPicks — vista y funciones de estadísticas (track record público)
--
-- Definiciones:
--   ROI   = beneficio_unidades / suma_de_stakes * 100   (retorno sobre lo arriesgado)
--   Yield = beneficio_unidades / nº_de_picks    * 100   (beneficio medio por pick, en % de 1u)
--   Racha = nº de aciertos consecutivos desde el último pick liquidado
--           (los 'void' no cuentan ni rompen la racha; un 'lost' la rompe)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Vista base: picks liquidados con P&L.  'cancelled' se excluye (no hubo apuesta).
-- security_invoker => aplica la RLS de picks al que consulta (los liquidados
-- son públicos, así que anónimos y usuarios ven lo mismo).
-- ---------------------------------------------------------------------------
create or replace view public.v_settled_picks
with (security_invoker = true) as
select
  p.id,
  p.sport_id,
  s.slug            as sport_slug,
  s.name            as sport_name,
  p.market_category,
  p.status,
  p.stake,
  p.odds,
  p.closing_odds,
  p.result_units,
  p.event_start_at,
  p.settled_at
from public.picks p
join public.sports s on s.id = p.sport_id
where p.status in ('won','lost','void');

-- ---------------------------------------------------------------------------
-- stats_overview — cifras globales del canal (opcionalmente por rango de fechas)
-- ---------------------------------------------------------------------------
create or replace function public.stats_overview(
  p_from timestamptz default null,
  p_to   timestamptz default null
)
returns table (
  total_picks   bigint,
  won           bigint,
  lost          bigint,
  void          bigint,
  staked_units  numeric,
  profit_units  numeric,
  roi_pct       numeric,
  yield_pct     numeric,
  hit_rate_pct  numeric,
  current_streak integer,
  first_pick_at timestamptz,
  last_pick_at  timestamptz
)
language sql stable security invoker set search_path = public as $$
  with base as (
    select *
    from public.v_settled_picks
    where (p_from is null or settled_at >= p_from)
      and (p_to   is null or settled_at <  p_to)
  ),
  agg as (
    select
      count(*)                                               as total_picks,
      count(*) filter (where status = 'won')                 as won,
      count(*) filter (where status = 'lost')                as lost,
      count(*) filter (where status = 'void')                as void,
      coalesce(sum(stake) filter (where status <> 'void'), 0) as staked_units,
      coalesce(sum(result_units), 0)                          as profit_units,
      min(settled_at)                                         as first_pick_at,
      max(settled_at)                                         as last_pick_at
    from base
  ),
  streak as (
    -- recorre los picks won/lost de más reciente a más antiguo; cuenta los
    -- aciertos que hay antes de la primera derrota
    select count(*) filter (where status = 'won' and losses_so_far = 0) as s
    from (
      select
        status,
        sum(case when status = 'lost' then 1 else 0 end)
          over (order by settled_at desc rows between unbounded preceding and current row) as losses_so_far
      from base
      where status in ('won','lost')
    ) t
  )
  select
    agg.total_picks, agg.won, agg.lost, agg.void,
    agg.staked_units, agg.profit_units,
    case when agg.staked_units > 0 then round(agg.profit_units / agg.staked_units * 100, 2) end,
    case when agg.total_picks  > 0 then round(agg.profit_units / agg.total_picks  * 100, 2) end,
    case when (agg.won + agg.lost) > 0
         then round(agg.won::numeric / (agg.won + agg.lost) * 100, 2) end,
    coalesce((select s from streak), 0)::int,
    agg.first_pick_at, agg.last_pick_at
  from agg;
$$;

-- ---------------------------------------------------------------------------
-- stats_by_sport — desglose por deporte
-- ---------------------------------------------------------------------------
create or replace function public.stats_by_sport(
  p_from timestamptz default null,
  p_to   timestamptz default null
)
returns table (
  sport_slug   text,
  sport_name   text,
  total_picks  bigint,
  staked_units numeric,
  profit_units numeric,
  roi_pct      numeric,
  yield_pct    numeric,
  hit_rate_pct numeric
)
language sql stable security invoker set search_path = public as $$
  select
    sport_slug,
    sport_name,
    count(*)                                                as total_picks,
    coalesce(sum(stake) filter (where status <> 'void'), 0) as staked_units,
    coalesce(sum(result_units), 0)                          as profit_units,
    case when sum(stake) filter (where status <> 'void') > 0
         then round(sum(result_units) / sum(stake) filter (where status <> 'void') * 100, 2) end,
    case when count(*) > 0
         then round(sum(result_units) / count(*) * 100, 2) end,
    case when count(*) filter (where status in ('won','lost')) > 0
         then round(count(*) filter (where status = 'won')::numeric
                    / count(*) filter (where status in ('won','lost')) * 100, 2) end
  from public.v_settled_picks
  where (p_from is null or settled_at >= p_from)
    and (p_to   is null or settled_at <  p_to)
  group by sport_slug, sport_name
  order by profit_units desc;
$$;

-- ---------------------------------------------------------------------------
-- stats_bankroll — unidades acumuladas por bucket temporal (día/semana/mes)
-- ---------------------------------------------------------------------------
create or replace function public.stats_bankroll(
  p_bucket text        default 'month',
  p_from   timestamptz default null,
  p_to     timestamptz default null
)
returns table (
  bucket_start     date,
  period_units     numeric,
  cumulative_units numeric
)
language sql stable security invoker set search_path = public as $$
  with b as (
    select
      date_trunc(
        case when p_bucket in ('day','week','month') then p_bucket else 'month' end,
        settled_at
      )::date          as bucket_start,
      sum(result_units) as period_units
    from public.v_settled_picks
    where (p_from is null or settled_at >= p_from)
      and (p_to   is null or settled_at <  p_to)
    group by 1
  )
  select
    bucket_start,
    round(period_units, 2),
    round(sum(period_units) over (order by bucket_start), 2)
  from b
  order by bucket_start;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on public.v_settled_picks to anon, authenticated;
grant execute on function public.stats_overview(timestamptz, timestamptz)        to anon, authenticated;
grant execute on function public.stats_by_sport(timestamptz, timestamptz)        to anon, authenticated;
grant execute on function public.stats_bankroll(text, timestamptz, timestamptz)  to anon, authenticated;
